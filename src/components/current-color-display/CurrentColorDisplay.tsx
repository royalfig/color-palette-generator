import { useEffect, useState } from 'react'
import { ShareIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import './current-color-display.css'
import { useCurrentColor } from '../../hooks/useCurrentColor'

export function CurrentColorDisplay({ palettes }: { palettes: any }) {
  const [colorName, setColorName] = useState('')

  const currentColor = useCurrentColor(palettes)
  const color = currentColor.hex
  console.log("🚀 ~ file: CurrentColorDisplay.tsx:12 ~ CurrentColorDisplay ~ color:", color)

  async function getColorName(color: string) {
    try {
      const res = await fetch(`https://api.color.pizza/v1/?values=${color.replace('#', '')}`)
      const name = await res.json()
      setColorName(name?.colors[0]?.name)
    } catch (e) {
      console.log(e.message)
    }
  }

  useEffect(() => {
    getColorName(color)
  }, [color])

  return (
    <div className="current-color-display flex">
      <div className="name-group flex">
        <div className="color-dot relative" style={{ backgroundColor: color }}></div>
        <motion.p
          className="color-name"
          key={colorName}
          initial={{ clipPath: 'inset(0 100% 0 0)' }} // Hides text initially
          animate={{ clipPath: 'inset(0 0 0 0)' }} // Reveals text
          exit={{ clipPath: 'inset(0 100% 0 0)' }} // Hides text again
          transition={{ duration: .5, ease: 'easeOut' }}
        >
          {colorName}
        </motion.p>
      </div>
      <button className="color-share-icon" aria-label="Share or save color by copying the URL" style={{ color: color }}>
        <ShareIcon className="icon" />
      </button>
    </div>
  )
}
