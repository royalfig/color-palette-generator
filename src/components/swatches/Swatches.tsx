import { useContext } from 'react'
import type { ColorFormat, ColorSpace } from '../../types'
import { ColorContext } from '../ColorContext'
import './swatches.css'

export function Swatches({ colorSpace }: { colorSpace: { space: ColorSpace; format: ColorFormat } }) {
  const context = useContext(ColorContext)
  if (!context) return null

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
            style={
              {
                '--color': color.cssValue,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
