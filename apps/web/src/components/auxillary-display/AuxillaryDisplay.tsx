import { useAnimate } from 'motion/react'
import { useContext, useEffect } from 'react'
import type { ColorFormat, ColorSpace } from '../../types'
import { BaseColorData } from '../../util/factory'
import { ColorHistory } from '../color-history/ColorHistory'
import { ColorContext } from '../ColorContext'
import { Swatches } from '../swatches/Swatches'
import './PaletteDetails.css'
import { MessageContext } from '../MessageContext'

function PaletteDetails({
  palette,
  colorNames,
  colorSpace,
}: {
  palette: BaseColorData[]
  colorNames: string[]
  colorSpace: { space: ColorSpace; format: ColorFormat }
}) {
  const { showMessage } = useContext(MessageContext)
  const handleColorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const colorValue = e.currentTarget.dataset.colorValue
    if (colorValue) {
      try {
        showMessage('Color copied', 'success')
        navigator.clipboard.writeText(colorValue)
      } catch (error) {
        console.error('Failed to copy color value:', error)
      }
    }
  }
  const [scope, animate] = useAnimate()

  useEffect(() => {
    if (!scope.current) return
    Array.from(scope.current.querySelectorAll('.palette-detail')).forEach((el, i) => {
      animate(el as HTMLElement, { opacity: 1 }, { type: 'spring', stiffness: 100, damping: 10, delay: i * 0.05 })
    })
  }, [palette])

  return (
    <div
      className="palette-details"
      ref={scope}
      style={{ '--items': Math.min(palette.length / 2, 6) } as React.CSSProperties}
    >
      {palette.map((color, index) => (
        <div
          key={color.code}
          style={{ '--bg': color.cssValue, '--color': color.contrast } as React.CSSProperties}
          className="palette-detail"
          data-color-value={color.conversions[colorSpace.format].value}
          onClick={handleColorClick}
        >
          {palette.length < 7 && <p>{colorNames?.[index]}</p>}
          <p>{color.conversions[colorSpace.format].value}</p>
        </div>
      ))}
    </div>
  )
}

export function AuxillaryDisplay({
  showPaletteColors,
  colorSpace,
  colorNames,
  paletteType,
  paletteStyle,
  showColorHistory,
  setColor,
  colorHistory,
  setColorHistory,
}: {
  showPaletteColors: boolean
  colorSpace: {
    space: ColorSpace
    format: ColorFormat
  }
  colorNames: string[]
  paletteType: string
  paletteStyle: string
  showColorHistory: boolean
  setColor: React.Dispatch<React.SetStateAction<string>>
  colorHistory: string[]
  setColorHistory: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const context = useContext(ColorContext)
  if (!context) return null

  const { palette } = context

  if (showPaletteColors) {
    return <PaletteDetails palette={palette} colorNames={colorNames} colorSpace={colorSpace} />
  }
  if (showColorHistory) {
    return <ColorHistory setColor={setColor} colorHistory={colorHistory} setColorHistory={setColorHistory} />
  }
  return <Swatches colorSpace={colorSpace} paletteType={paletteType} paletteStyle={paletteStyle} />
}
