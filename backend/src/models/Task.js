// src/models/Task.js
const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: [true, 'clientId is required'],
      unique: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Task text is required'],
      trim: true,
      maxlength: [500, 'Task text cannot exceed 500 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending'],
      default: 'synced',
    },
    clientCreatedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    subtasks: {
      type: [
        {
          text: { type: String, required: true, trim: true },
          completed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
)

taskSchema.index({ category: 1 })
taskSchema.index({ completed: 1 })
taskSchema.index({ isDeleted: 1 })
taskSchema.index({ clientCreatedAt: -1 })

// Mongoose 8.x — no next parameter
taskSchema.pre('save', function () {
  if (this.isModified('completed')) {
    this.completedAt = this.completed ? new Date() : null
  }
})

taskSchema.set('toJSON', { virtuals: true })
taskSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Task', taskSchema)