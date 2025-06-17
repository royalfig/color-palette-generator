import { useContext } from 'react'
import { ColorContext } from '../ColorContext'
import './section-header.css'
import { useFetchColorNames } from '../../hooks/useColorName'

function VibrancyModule() {
  const context = useContext(ColorContext)
  if (!context) return null

  const { palette, colorObj } = context

  const colors = palette.map(color => color.string)
  const linearGradient = `linear-gradient(to right in ${palette[0].colorSpace}, ${colors.join(', ')})`

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
