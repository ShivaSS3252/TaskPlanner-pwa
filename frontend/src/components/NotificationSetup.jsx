// src/components/NotificationSetup.jsx
import { useState, useEffect } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '../firebase'

const API_URL = import.meta.env.VITE_API_URL

export const NotificationSetup = () => {
  const [permission, setPermission] = useState(Notification.permission)
  const [token, setToken] = useState(localStorage.getItem('fcm_token'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (permission !== 'granted') return

    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {}
      if (title || body) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `${title ? title + ': ' : ''}${body || ''}`, type: 'info' }
        }))
      }
    })

    const handleSWMessage = (event) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const { title, body } = event.data.payload.notification || {}
        if (title || body) {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `${title ? title + ': ' : ''}${body || ''}`, type: 'info' }
          }))
        }
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleSWMessage)
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
    }
  }, [permission])

  const handleEnable = async () => {
    if (permission === 'granted' && token) return
    if (permission === 'denied') return
    setLoading(true)
    const fcmToken = await requestNotificationPermission()
    if (fcmToken) {
      setToken(fcmToken)
      setPermission('granted')
      try {
        await fetch(`${API_URL}/api/notifications/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: fcmToken }),
        })
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Push notifications enabled', type: 'success' }
      }))
    } else {
      setPermission(Notification.permission)
    }
    setLoading(false)
  }

  const isEnabled = permission === 'granted' && token
  const isDenied  = permission === 'denied'

  return (
    <button
      onClick={handleEnable}
      disabled={loading || isEnabled || isDenied}
      style={{
        height: '30px', padding: '0 10px', borderRadius: '8px',
        position: 'relative',
        background: isEnabled
          ? 'rgba(163,230,53,0.1)'
          : isDenied
            ? 'rgba(239,68,68,0.07)'
            : 'var(--bg-input)',
        border: isEnabled
          ? '1px solid rgba(163,230,53,0.25)'
          : isDenied
            ? '1px solid rgba(239,68,68,0.15)'
            : '1px solid var(--bg-input-border)',
        color: isEnabled
          ? 'var(--lime)'
          : isDenied
            ? 'rgba(248,113,113,0.6)'
            : 'var(--text-muted)',
        cursor: isEnabled || isDenied ? 'default' : loading ? 'wait' : 'pointer',
        fontSize: '12px', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: '5px',
        transition: 'all 0.2s', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '13px' }}>
        {loading ? '⋯' : isDenied ? '🔕' : '🔔'}
      </span>
      <span>
        {loading ? 'Setting up...' : isEnabled ? 'Alerts on' : isDenied ? 'Blocked' : 'Alerts'}
      </span>
      {isEnabled && (
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--lime)',
          boxShadow: '0 0 5px rgba(163,230,53,0.7)',
        }} />
      )}
    </button>
  )
}
