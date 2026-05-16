const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const seedCategories = require('./config/seed')
const { errorHandler } = require('./middleware/errorHandler')

dotenv.config()

connectDB().then(() => {
  seedCategories()
})

// ── Firebase Admin init ──────────────────────────────────────────────────
const admin = require('firebase-admin')

let serviceAccount
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else {
  serviceAccount = require('../firebase-service-account.json')
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
console.log('Firebase Admin initialized ✅')

// ── Express app ──────────────────────────────────────────────────────────
const app = express()

// ── Middleware ───────────────────────────────────────────────────────────
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:4173',
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}))

// ── SSE — Server Sent Events ─────────────────────────────────────────────
// Real-time push from server to all connected clients
// Real world example: Slack notifying all members when a new channel is added
const sseClients = new Set()

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Confirm connection to client
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE connected ✅' })}\n\n`)

  sseClients.add(res)
  console.log(`SSE client connected. Total: ${sseClients.size}`)

  // Heartbeat every 30s — prevents proxy/firewall closing idle connections
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT' })}\n\n`)
  }, 30000)

  req.on('close', () => {
    sseClients.delete(res)
    clearInterval(heartbeat)
    console.log(`SSE client disconnected. Total: ${sseClients.size}`)
  })
})

// Broadcast to ALL connected SSE clients
// Called from route handlers after any category mutation
const broadcast = (data) => {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  sseClients.forEach((client) => client.write(payload))
  console.log(`Broadcast to ${sseClients.size} clients:`, data.type)
}

app.locals.broadcast = broadcast

// ── Routes ───────────────────────────────────────────────────────────────
const { router: notifRouter } = require('./routes/notifications')

app.use('/api/notifications', notifRouter)
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/admin', require('./routes/admin'))

// ── Health check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TaskPlanner PWA API is running ✅',
    timestamp: new Date().toISOString(),
    sseClients: sseClients.size,
  })
})

// ── 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Error handler — must be last ──────────────────────────────────────────
app.use(errorHandler)

// ── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
})