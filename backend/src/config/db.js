// src/config/db.js
const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Connected: ${conn.connection.host} ✅`)
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message} ❌`)
    // Exit process if DB connection fails
    // No point running server without database
    process.exit(1)
  }
}

module.exports = connectDB