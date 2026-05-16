const admin = require('firebase-admin')
const User = require('../models/User')

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' })
  }

  const token = authHeader.split('Bearer ')[1]
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.userId = decoded.uid
    req.userEmail = decoded.email

    // Upsert user into MongoDB so users collection stays in sync
    User.findOneAndUpdate(
      { uid: decoded.uid },
      {
        email: decoded.email,
        name: decoded.name || '',
        photo: decoded.picture || '',
        lastLoginAt: new Date(),
      },
      { upsert: true, new: true }
    ).catch((err) => console.error('User upsert failed:', err))

    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

module.exports = authenticate
