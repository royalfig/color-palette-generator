import { useEffect, useState } from 'react'
import Button from '../button/Button'

export function DarkMode() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-mode', 'dark')
    } else {
      document.documentElement.setAttribute('data-mode', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').matches && setDarkMode(true)
  }, [])

  return (
    <Button handler={() => setDarkMode(!darkMode)} active={darkMode} key="dark">
      Dark Mode
    </Button>
  )
}
