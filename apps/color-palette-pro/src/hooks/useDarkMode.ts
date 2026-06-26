import { useEffect, useState, useCallback } from 'react'

export function useDarkMode() {
  // Helper to get initial mode
  const getInitialMode = () => {
    const stored = localStorage.getItem('dark-mode')
    if (stored !== null) {
      return stored === 'true'
    }
    // Fallback to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [isDarkMode, setIsDarkMode] = useState(getInitialMode)

  // Update DOM and localStorage when isDarkMode changes
  useEffect(() => {
    document.documentElement.dataset.mode = isDarkMode ? 'dark' : 'light'
    localStorage.setItem('dark-mode', String(isDarkMode))
  }, [isDarkMode])

  // Listen for system preference changes (optional, can remove if not desired)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('dark-mode') === null) {
        setIsDarkMode(e.matches)
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev)
  }, [])

  return { isDarkMode, toggleDarkMode }
}
