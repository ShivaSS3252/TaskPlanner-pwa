const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Task = require('../models/Task')
const Category = require('../models/Category')
const { asyncHandler } = require('../middleware/errorHandler')
const authenticate = require('../middleware/auth')

const validateCategory = async (categoryId, userId) => {
  if (!categoryId) return null
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw { status: 400, message: 'Invalid category ID format' }
  }
  const category = await Category.findOne({ _id: categoryId, userId })
  if (!category) {
    throw { status: 404, message: `Category with ID "${categoryId}" does not exist` }
  }
  return category
}

// Apply auth to all task routes
router.use(authenticate)

// GET /api/tasks
router.get('/', asyncHandler(async (req, res) => {
  const filter = { isDeleted: false, userId: req.userId }

  if (req.query.category) {
    if (!mongoose.Types.ObjectId.isValid(req.query.category)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID format' })
    }
    filter.category = req.query.category
  }
  if (req.query.completed !== undefined) filter.completed = req.query.completed === 'true'
  if (req.query.syncStatus) filter.syncStatus = req.query.syncStatus

  const tasks = await Task.find(filter)
    .populate('category', 'name color')
    .sort({ clientCreatedAt: -1 })

  res.json({ success: true, count: tasks.length, data: tasks })
}))

// POST /api/tasks
router.post('/', asyncHandler(async (req, res) => {
  const { clientId, text, completed, category, priority, dueDate, clientCreatedAt } = req.body

  if (!clientId || !text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'clientId and text are required' })
  }

  const existing = await Task.findOne({ clientId, userId: req.userId })
  if (existing) {
    await existing.populate('category', 'name color')
    return res.status(200).json({ success: true, data: existing, message: 'Task already exists' })
  }

  try {
    await validateCategory(category, req.userId)
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, error: err.message })
  }

  const task = await Task.create({
    clientId,
    text: text.trim(),
    completed: completed || false,
    category: category || null,
    priority: priority || 'medium',
    dueDate: dueDate || null,
    syncStatus: 'synced',
    clientCreatedAt: clientCreatedAt ? new Date(clientCreatedAt) : new Date(),
    userId: req.userId,
  })

  if (category) {
    await Category.findOneAndUpdate({ _id: category, userId: req.userId }, { $inc: { taskCount: 1 } })
  }

  await task.populate('category', 'name color')
  res.status(201).json({ success: true, data: task })
}))

// PATCH /api/tasks/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const { text, completed, category, priority, dueDate, syncStatus } = req.body

  const task = await Task.findOne({ clientId: req.params.id, isDeleted: false, userId: req.userId })
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found or already deleted' })
  }

  if (category !== undefined && category !== null) {
    try {
      await validateCategory(category, req.userId)
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, error: err.message })
    }
  }

  const oldCategory = task.category?.toString()

  if (text !== undefined) task.text = text.trim()
  if (completed !== undefined) task.completed = completed
  if (category !== undefined) task.category = category || null
  if (priority !== undefined) task.priority = priority
  if (dueDate !== undefined) task.dueDate = dueDate
  if (syncStatus !== undefined) task.syncStatus = syncStatus

  await task.save()

  const newCategory = task.category?.toString()
  if (oldCategory !== newCategory) {
    if (oldCategory) await Category.findOneAndUpdate({ _id: oldCategory, userId: req.userId }, { $inc: { taskCount: -1 } })
    if (newCategory) await Category.findOneAndUpdate({ _id: newCategory, userId: req.userId }, { $inc: { taskCount: 1 } })
  }

  await task.populate('category', 'name color')
  res.json({ success: true, data: task })
}))

// PATCH /api/tasks/:id/subtasks — add a subtask
router.patch('/:id/subtasks', asyncHandler(async (req, res) => {
  const { text } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'text is required' })
  }

  const task = await Task.findOne({ clientId: req.params.id, isDeleted: false, userId: req.userId })
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  task.subtasks.push({ text: text.trim(), completed: false })
  await task.save()
  await task.populate('category', 'name color')
  res.json({ success: true, data: task })
}))

// PATCH /api/tasks/:id/subtasks/:subtaskId — toggle or edit subtask
router.patch('/:id/subtasks/:subtaskId', asyncHandler(async (req, res) => {
  const task = await Task.findOne({ clientId: req.params.id, isDeleted: false, userId: req.userId })
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' })

  const subtask = task.subtasks.id(req.params.subtaskId)
  if (!subtask) return res.status(404).json({ success: false, error: 'Subtask not found' })

  if (req.body.text !== undefined) subtask.text = req.body.text.trim()
  else subtask.completed = !subtask.completed

  await task.save()
  await task.populate('category', 'name color')
  res.json({ success: true, data: task })
}))

// DELETE /api/tasks/:id/subtasks/:subtaskId — delete subtask
router.delete('/:id/subtasks/:subtaskId', asyncHandler(async (req, res) => {
  const task = await Task.findOne({ clientId: req.params.id, isDeleted: false, userId: req.userId })
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' })

  const subtask = task.subtasks.id(req.params.subtaskId)
  if (!subtask) return res.status(404).json({ success: false, error: 'Subtask not found' })

  subtask.deleteOne()
  await task.save()
  await task.populate('category', 'name color')
  res.json({ success: true, data: task })
}))

// DELETE /api/tasks/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findOne({ clientId: req.params.id, userId: req.userId })

  if (!task) {
    return res.status(200).json({ success: true, data: {}, message: 'Task already deleted' })
  }

  if (task.category && !task.isDeleted) {
    await Category.findOneAndUpdate({ _id: task.category, userId: req.userId }, { $inc: { taskCount: -1 } })
  }

  await Task.findOneAndDelete({ clientId: req.params.id, userId: req.userId })
  res.json({ success: true, data: {}, message: 'Task permanently deleted' })
}))

// POST /api/tasks/sync
router.post('/sync', asyncHandler(async (req, res) => {
  const { tasks } = req.body

  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ success: false, error: 'tasks array is required' })
  }

  const results = []

  for (const taskData of tasks) {
    try {
      if (!taskData.clientId || !taskData.text) {
        results.push({ clientId: taskData.clientId, status: 'failed', error: 'clientId and text required' })
        continue
      }

      const existing = await Task.findOne({ clientId: taskData.clientId, userId: req.userId })
      if (existing) {
        results.push({ clientId: taskData.clientId, status: 'already_exists' })
        continue
      }

      let resolvedCategory = null
      if (taskData.category && mongoose.Types.ObjectId.isValid(taskData.category)) {
        const cat = await Category.findOne({ _id: taskData.category, userId: req.userId })
        resolvedCategory = cat ? taskData.category : null
      }

      const task = await Task.create({
        clientId: taskData.clientId,
        text: taskData.text.trim(),
        completed: taskData.completed || false,
        category: resolvedCategory,
        priority: taskData.priority || 'medium',
        clientCreatedAt: taskData.clientCreatedAt ? new Date(taskData.clientCreatedAt) : new Date(),
        syncStatus: 'synced',
        userId: req.userId,
      })

      if (resolvedCategory) {
        await Category.findOneAndUpdate({ _id: resolvedCategory, userId: req.userId }, { $inc: { taskCount: 1 } })
      }

      results.push({ clientId: task.clientId, status: 'synced' })
    } catch (err) {
      results.push({ clientId: taskData.clientId, status: 'failed', error: err.message })
    }
  }

  res.json({
    success: true,
    results,
    synced: results.filter((r) => r.status === 'synced').length,
    already_exists: results.filter((r) => r.status === 'already_exists').length,
    failed: results.filter((r) => r.status === 'failed').length,
  })
}))

module.exports = router
