const express = require('express')
const router = express.Router()
const admin = require('firebase-admin')
const Task = require('../models/Task')
const Category = require('../models/Category')

// GET /api/admin/users
// Lists all users who have signed in via Google, with their task/category counts
router.get('/users', async (req, res) => {
  try {
    // Fetch all users from Firebase Auth
    const listResult = await admin.auth().listUsers()

    const users = await Promise.all(
      listResult.users.map(async (u) => {
        const [taskCount, categoryCount] = await Promise.all([
          Task.countDocuments({ userId: u.uid, isDeleted: false }),
          Category.countDocuments({ userId: u.uid }),
        ])

        return {
          uid: u.uid,
          name: u.displayName || 'No name',
          email: u.email,
          photo: u.photoURL || null,
          taskCount,
          categoryCount,
          lastSignIn: u.metadata.lastSignInTime,
          createdAt: u.metadata.creationTime,
        }
      })
    )

    res.json({
      success: true,
      totalUsers: users.length,
      users,
    })
  } catch (err) {
    console.error('Admin users fetch failed:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
