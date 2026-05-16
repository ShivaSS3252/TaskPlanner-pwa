// src/routes/notifications.js
const express = require('express')
const router = express.Router()

// In-memory token store — good enough for demo
// In production: save to MongoDB
const fcmTokens = []

router.post('/token', (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ success: false, error: 'Token required' })
  if (!fcmTokens.includes(token)) {
    fcmTokens.push(token)
    console.log(`New FCM token registered. Total devices: ${fcmTokens.length}`)
  }
  res.json({ success: true, message: 'Token saved' })
})

module.exports = { router, fcmTokens }