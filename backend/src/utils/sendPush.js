// src/utils/sendPush.js
const admin = require('firebase-admin')

const sendPush = async (tokens, title, body) => {
  if (!tokens || tokens.length === 0) return
  
  for (const token of tokens) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        webpush: {
          notification: {
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            vibrate: [200, 100, 200],
          }
        }
      })
      console.log(`FCM push sent ✅: ${body}`)
    } catch (err) {
      console.log(`FCM push failed for token: ${err.message}`)
      // Token is stale — remove it
      const index = tokens.indexOf(token)
      if (index > -1) tokens.splice(index, 1)
    }
  }
}

module.exports = sendPush