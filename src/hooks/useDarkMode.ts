import { useEffect, useState, useCallback } from 'react'

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.dataset.mode === 'dark')

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode
      localStorage.setItem('dark-mode', String(newMode))
      return newMode
    })
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.dataset.mode = 'dark'
    } else {
      document.documentElement.dataset.mode = 'light'
    }
  }, [isDarkMode])

  return { isDarkMode, toggleDarkMode }
}
