import { useContext } from 'react'
import type { ColorSpace, ColorFormat, PaletteStyle } from '../../types'
import { Swatches } from '../swatches/Swatches'
import { ColorContext } from '../ColorContext'
import { ColorName } from '../../App'

export function AuxillaryDisplay({
  showPaletteColors,
  colorSpace,
  colorNames,
  paletteType,
  paletteStyle,
}: {
  showPaletteColors: boolean
  colorSpace: {
    space: ColorSpace
    format: ColorFormat
  }
  colorNames: string[]
  paletteType: string
  paletteStyle: string
}) {
  const context = useContext(ColorContext)
  if (!context) return null

  const { palette } = context

  if (showPaletteColors) {
    return (
      <div style={{ gridColumn: '7 / 13' }}>
        {palette.map((color, index) => (
          <div key={color.code} style={{ backgroundColor: color.cssValue }}>
            <div style={{ color: color.contrast, padding: '4px 8px', fontSize: '12px' }}>
              <p>{colorNames?.[index]}</p>
              <p>{color.conversions[colorSpace.format].value}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }
  return <Swatches colorSpace={colorSpace} paletteType={paletteType} paletteStyle={paletteStyle} />
}
