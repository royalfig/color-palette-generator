import { useReducedMotion } from 'motion/react'
import React, { useContext, useMemo, useRef, memo, useEffect } from 'react'
import type { ColorFormat, ColorSpace } from '../../types'
import { ColorContext } from '../ColorContext'
import { MessageContext } from '../MessageContext'
import './swatches.css'

export const Swatches = memo(function Swatches({
  colorSpace,
  paletteType,
  paletteStyle,
}: {
  colorSpace: { space: ColorSpace; format: ColorFormat }
  paletteType: string
  paletteStyle: string
}) {
  const context = useContext(ColorContext)
  const { palette } = context
  const totalSquares = 240
  const columns = 24
  const rows = 10
  const colorsCount = palette.length
  const columnsPerColor = Math.floor(columns / colorsCount)
  const { showMessage } = useContext(MessageContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousPaletteKeyRef = useRef<string>('')
  const shouldReduceMotion = useReducedMotion()

  // Create a stable key for palette comparison
  const paletteKey = useMemo(() => palette.map(p => p.cssValue).join('|'), [palette])

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const color = (e.target as HTMLDivElement).closest('.swatch') as HTMLDivElement

    if (color && color.dataset.color) {
      try {
        await navigator.clipboard.writeText(color.dataset.color)
        showMessage('Color copied', 'success')
      } catch (error) {
        console.error('Failed to copy color to clipboard:', error)
      }
    }
  }

  // High-performance CSS transition approach
  // Using CSS transitions is much more performant than 240 JS animations
  // Browser can optimize CSS transitions natively with GPU acceleration
  useEffect(() => {
    if (!containerRef.current || paletteKey === previousPaletteKeyRef.current) return

    previousPaletteKeyRef.current = paletteKey

    const container = containerRef.current
    const swatches = Array.from(container.querySelectorAll('.swatch')) as HTMLElement[]

    if (shouldReduceMotion) {
      // Instant update for reduced motion
      swatches.forEach((el, i) => {
        const col = i % columns
        let colorIdx = Math.floor(col / columnsPerColor)
        if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
        el.style.backgroundColor = palette[colorIdx].cssValue
      })
      return
    }

    // Batch all DOM reads first
    const updates: Array<{ el: HTMLElement; color: string; delay: number }> = []
    swatches.forEach((el, i) => {
      const col = i % columns
      const row = Math.floor(i / columns)
      let colorIdx = Math.floor(col / columnsPerColor)
      if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
      const targetColor = palette[colorIdx].cssValue

      // Calculate delay for top-left to bottom-right cascade
      // Top-left (row=0, col=0) = 0ms delay
      // Bottom-right (row=rows-1, col=columns-1) = max delay
      const delay = (row + col) * 0.01 // 10ms per step for visible cascade effect

      updates.push({ el, color: targetColor, delay })
    })

    // Use double RAF to ensure transitions are set before color changes
    // This ensures browser properly triggers the transitions
    requestAnimationFrame(() => {
      // First frame: Set all transitions
      updates.forEach(({ el, delay }) => {
        el.style.transition = `background-color 0.2s ease-out ${delay}s`
      })
      
      // Second frame: Trigger transitions by setting colors
      requestAnimationFrame(() => {
        updates.forEach(({ el, color }) => {
          el.style.backgroundColor = color
        })
      })
    })
  }, [paletteKey, columns, columnsPerColor, colorsCount, palette, shouldReduceMotion])

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
      ref={containerRef}
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
})
