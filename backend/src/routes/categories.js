const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Category = require('../models/Category')
const Task = require('../models/Task')
const { asyncHandler } = require('../middleware/errorHandler')
const sendPush = require('../utils/sendPush')
const { fcmTokens } = require('./notifications')
const authenticate = require('../middleware/auth')

// Apply auth to all category routes
router.use(authenticate)

// GET all
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find({ userId: req.userId }).sort({ createdAt: -1 })
  res.json({ success: true, count: categories.length, data: categories })
}))

// GET one
router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid category ID format' })
  }
  const category = await Category.findOne({ _id: req.params.id, userId: req.userId })
  if (!category) return res.status(404).json({ success: false, error: 'Category not found' })
  res.json({ success: true, data: category })
}))

// POST create
router.post('/', asyncHandler(async (req, res) => {
  const { name, color, description } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required' })
  }

  const existing = await Category.findOne({
    userId: req.userId,
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
  })
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `A category named "${name.trim()}" already exists`,
      code: 'DUPLICATE_NAME',
    })
  }

  const category = await Category.create({
    name: name.trim(),
    color: color || '#6366f1',
    description: description || '',
    userId: req.userId,
  })

  if (req.app.locals.broadcast) {
    req.app.locals.broadcast({ type: 'NEW_CATEGORY', data: category, userId: req.userId })
  }

  await sendPush(fcmTokens, '⚡ TaskPlanner PWA', `New category "${category.name}" added`)

  res.status(201).json({ success: true, data: category })
}))

// PATCH update
router.patch('/:id', asyncHandler(async (req, res) => {
  const { name, color, description } = req.body

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid category ID format' })
  }

  const category = await Category.findOne({ _id: req.params.id, userId: req.userId })
  if (!category) return res.status(404).json({ success: false, error: 'Category not found' })

  if (name && name.trim() !== category.name) {
    const duplicate = await Category.findOne({
      _id: { $ne: req.params.id },
      userId: req.userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    })
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `A category named "${name.trim()}" already exists`,
        code: 'DUPLICATE_NAME',
      })
    }
  }

  if (name !== undefined) category.name = name.trim()
  if (color !== undefined) category.color = color
  if (description !== undefined) category.description = description
  await category.save()

  if (req.app.locals.broadcast) {
    req.app.locals.broadcast({ type: 'UPDATED_CATEGORY', data: category, userId: req.userId })
  }

  await sendPush(fcmTokens, '⚡ TaskPlanner PWA', `Category "${category.name}" was updated`)

  res.json({ success: true, data: category })
}))

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid category ID format' })
  }

  const category = await Category.findOne({ _id: req.params.id, userId: req.userId })
  if (!category) {
    return res.status(200).json({ success: true, data: {}, message: 'Category already deleted' })
  }

  const categoryName = category.name
  await Category.findByIdAndDelete(req.params.id)

  const updateResult = await Task.updateMany(
    { category: req.params.id, userId: req.userId, isDeleted: false },
    { $set: { category: null } }
  )

  if (req.app.locals.broadcast) {
    req.app.locals.broadcast({ type: 'DELETED_CATEGORY', data: { id: req.params.id }, userId: req.userId })
  }

  await sendPush(fcmTokens, '⚡ TaskPlanner PWA', `Category "${categoryName}" was deleted`)

  res.json({
    success: true,
    data: {},
    message: `Category deleted. ${updateResult.modifiedCount} tasks uncategorized.`,
  })
}))

module.exports = router
