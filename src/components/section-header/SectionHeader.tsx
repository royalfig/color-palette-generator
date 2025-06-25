import { useContext } from 'react'
import { ColorContext } from '../ColorContext'
import './section-header.css'

function VibrancyModule() {
  const context = useContext(ColorContext)
  if (!context) return null

  const { originalColor, palette } = context
  const baseColor = originalColor

  const colors = palette.map(color => color.string)
  const linearGradient = `linear-gradient(to right in ${baseColor?.colorSpace}, ${colors.join(', ')})`

  return (
    <div className="vibrancy-module">
      <div className="vibrancy-module-inner" style={{ background: linearGradient }}></div>
      <div className="vibrancy-module-blur" style={{ background: linearGradient }}></div>
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
