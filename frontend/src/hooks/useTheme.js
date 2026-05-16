// src/hooks/useTheme.js
import { useState, useEffect } from 'react'

export const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('planner-ai-theme') || 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('planner-ai-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
