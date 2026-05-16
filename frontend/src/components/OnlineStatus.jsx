// src/components/OnlineStatus.jsx
import { useEffect, useRef } from 'react'

export const OnlineStatus = () => {
  const isFirstMount = useRef(true)

  useEffect(() => {
    const handleOnline = () => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Back online — syncing tasks...', type: 'success' }
      }))
    }
    const handleOffline = () => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: "You're offline — tasks save locally", type: 'warning' }
      }))
    }

    // Only show offline toast on mount if actually offline (not on first load online)
    if (!isFirstMount.current && !navigator.onLine) handleOffline()
    isFirstMount.current = false

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}
