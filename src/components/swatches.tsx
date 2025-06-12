import { useContext } from 'react'
import { ColorContext } from './ColorContext'
import type { BaseColorData } from '../util/factory'

export function Swatches() {
  console.log('swatches rendering')
  const context = useContext(ColorContext)
  if (!context) return null

  const { currentPalette } = context

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', padding: '10px' }}>
      {currentPalette.map((color: BaseColorData) => (
        <div key={color.code}>
          <div className="swatch" style={{ backgroundColor: color.string, width: '100px', height: '100px' }} />
        </div>
      ))}
    </div>
  )
}
