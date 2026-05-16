// src/config/seed.js
// Seeds default categories on first run
// Real world: Like how apps come with default settings

const Category = require('../models/Category')

const defaultCategories = [
  {
    name: 'Personal',
    color: '#6366f1',
    description: 'Personal tasks and goals'
  },
  {
    name: 'Work',
    color: '#f59e0b',
    description: 'Work related tasks'
  },
  {
    name: 'Shopping',
    color: '#10b981',
    description: 'Shopping lists'
  },
  {
    name: 'Health',
    color: '#ef4444',
    description: 'Health and fitness tasks'
  }
]

// Seed disabled — categories now require a userId (per-user data)
// Each user gets their own categories after signing in
const seedCategories = async () => {
  console.log('Seed skipped — auth-enabled, per-user categories')
}

module.exports = seedCategories