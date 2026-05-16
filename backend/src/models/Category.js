// src/models/Category.js
const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    color: {
      type: String,
      default: '#6366f1',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    taskCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeletable:{
        type:Boolean,
        default:true
    }
  },
  { timestamps: true }
)

categorySchema.index({ isActive: 1 })
categorySchema.index({ userId: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Category', categorySchema)