import { useContext } from 'react'
import { ColorContext } from '../ColorContext'
import './section-header.css'
import { motion } from 'motion/react'

function VibrancyModule() {
  const context = useContext(ColorContext)
  if (!context) return null

  const { originalColor, palette } = context
  const baseColor = originalColor

  const colors = palette.map(color => color.string)
  const linearGradient = `linear-gradient(to right in ${baseColor?.colorSpace}, ${colors.join(', ')})`

  return (
    <div className="vibrancy-module">
      <motion.div className="vibrancy-module-inner" animate={{ background: linearGradient }}></motion.div>
      <motion.div className="vibrancy-module-blur" animate={{ background: linearGradient }}></motion.div>
    </div>
  )
}

export function SectionHeader() {
  return (
    <div className="synth-brand col-12">
      <h1 className="brand">
        <span>Color</span>Palette Pro
      </h1>

      <VibrancyModule />
    </div>
  )
}
