import { useContext } from 'react'
import { stagger, useAnimate } from 'motion/react'
import type { ColorFormat, ColorSpace } from '../../types'
import { ColorContext } from '../ColorContext'
import './swatches.css'
import { useEffect } from 'react'

export function Swatches({
  colorSpace,
  paletteType,
  paletteStyle,
}: {
  colorSpace: { space: ColorSpace; format: ColorFormat }
  paletteType: string
  paletteStyle: string
}) {
  const context = useContext(ColorContext)
  const [scope, animate] = useAnimate()
  const { palette } = context
  const totalSquares = 240
  const columns = 24
  const rows = 10
  const colorsCount = palette.length
  const columnsPerColor = Math.floor(columns / colorsCount)

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const color = (e.target as HTMLDivElement).closest('.swatch') as HTMLDivElement

    if (color && color.dataset.color) {
      try {
        await navigator.clipboard.writeText(color.dataset.color)
      } catch (error) {
        console.error('Failed to copy color to clipboard:', error)
      }
    }
  }

  // Animate swatches when palette changes
  useEffect(() => {
    if (!scope.current) return

    Array.from(scope.current.querySelectorAll('.swatch')).forEach((el, i) => {
      const col = i % columns
      const row = Math.floor(i / columns)
      let colorIdx = Math.floor(col / columnsPerColor)
      if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
      const targetColor = palette[colorIdx].cssValue

      animate(
        el as HTMLElement,
        { backgroundColor: targetColor },
        {
          duration: 0.025,
          delay: (row + col) * 0.01,
        },
      )
    })
  }, [palette, paletteType, paletteStyle, animate, columns, rows, columnsPerColor, colorsCount])

  return (
    <div
      style={
        {
          '--columns': columns,
          '--rows': rows,
        } as React.CSSProperties
      }
      className="swatch-container"
      onClick={handleClick}
      ref={scope}
    >
      {Array.from({ length: totalSquares }).map((_, i) => {
        const col = i % columns
        let colorIdx = Math.floor(col / columnsPerColor)
        if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
        const color = palette[colorIdx]

        return (
          <div
            key={i}
            className="swatch"
            data-color={color.conversions[colorSpace.format].value}
            style={{
              backgroundColor: color.cssValue,
            }}
          />
        )
      })}
    </div>
  )
}
