import { useContext } from 'react'
import type { ColorSpace, ColorFormat } from '../../types'
import { Swatches } from '../swatches/Swatches'
import { ColorContext } from '../ColorContext'

export function AuxillaryDisplay({
  showPaletteColors,
  colorSpace,
}: {
  showPaletteColors: boolean
  colorSpace: {
    space: ColorSpace
    format: ColorFormat
  }
}) {
  const context = useContext(ColorContext)
  if (!context) return null

  const { palette } = context

  if (showPaletteColors) {
    return (
      <div style={{ gridColumn: '7 / 13' }}>
        {palette.map(color => (
          <div key={color.code} style={{ backgroundColor: color.cssValue }}>
            <div style={{ color: color.contrast, padding: '4px 8px' }}>
              {color.conversions[colorSpace.format].value}
            </div>
          </div>
        ))}
      </div>
    )
  }
  return <Swatches colorSpace={colorSpace} />
}
