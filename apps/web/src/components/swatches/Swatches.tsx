import { useReducedMotion } from 'motion/react'
import React, { useContext, useMemo, useRef, memo, useEffect } from 'react'
import type { ColorFormat, ColorSpace } from '../../types'
import { ColorContext } from '../ColorContext'
import { MessageContext } from '../MessageContext'
import './swatches.css'

// Hero-section UI mockup (24 columns × 10 rows = 240 cells).
// col 0 = surface margin; col 1 = container buffer; cols 2-11 = text content; cols 12-23 = image.
// Image placeholder is inset with container buffers: top (row 1), bottom (row 9), right (col 23).
// Mountain content occupies rows 2-8, cols 12-22 (11 wide × 7 tall):
//   container-sunken = sky (upper rows), outline = two peaks + base (lower rows).
//   Left peak ~col 14, right peak ~col 20, valley at col 18.
// Buttons (row 8): solid primary block + solid secondary block (one row only).
// Uses 8 of 24 tokens; on-primary/on-secondary, container-overlay, tertiary, semantic colors omitted.
const UI_LAYOUT: string[] = [
  // Row 0: surface top margin
  ...Array(24).fill('surface'),
  // Row 1: card top (full width incl. image top buffer)
  'surface', ...Array(23).fill('container'),
  // Row 2: surface + buffer + headline (on-surface×9) + fill | sky×11 + right buffer
  'surface', 'container', ...Array(9).fill('on-surface'), 'container',
  ...Array(11).fill('container-sunken'), 'container',
  // Row 3: surface + container spacer | left peak tip (sk×2, outline×1, sk×8) + right buffer
  'surface', ...Array(11).fill('container'),
  ...Array(2).fill('container-sunken'), 'outline', ...Array(8).fill('container-sunken'), 'container',
  // Row 4: surface + buffer + subtext L1 (×7) + fill | sk×1, outline×3, sk×3, outline×1, sk×3 + right buffer
  'surface', 'container', ...Array(7).fill('on-surface-variant'), ...Array(3).fill('container'),
  'container-sunken', ...Array(3).fill('outline'),
  ...Array(3).fill('container-sunken'), 'outline', ...Array(3).fill('container-sunken'), 'container',
  // Row 5: surface + buffer + subtext L2 (×5) + fill | outline×5, sk×2, outline×3, sk×1 + right buffer
  'surface', 'container', ...Array(5).fill('on-surface-variant'), ...Array(5).fill('container'),
  ...Array(5).fill('outline'), ...Array(2).fill('container-sunken'),
  ...Array(3).fill('outline'), 'container-sunken', 'container',
  // Row 6: surface + container spacer | outline×6, sk×1, outline×4 + right buffer
  'surface', ...Array(11).fill('container'),
  ...Array(6).fill('outline'), 'container-sunken', ...Array(4).fill('outline'), 'container',
  // Row 7: surface + container spacer | mountain base + right buffer
  'surface', ...Array(11).fill('container'),
  ...Array(11).fill('outline'), 'container',
  // Row 8: surface + buffer + primary×4 + gap + secondary×4 + fill | mountain base + right buffer
  'surface', 'container',
  ...Array(4).fill('primary'), 'container', ...Array(4).fill('secondary'), 'container',
  ...Array(11).fill('outline'), 'container',
  // Row 9: card bottom (full width incl. image bottom buffer)
  'surface', ...Array(23).fill('container'),
]

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
  const { palette, isUiMode } = context
  const totalSquares = 240
  const columns = 24
  const rows = 10
  const colorsCount = palette.length
  const columnsPerColor = Math.floor(columns / colorsCount)
  const { showMessage } = useContext(MessageContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousPaletteKeyRef = useRef<string>('')
  const shouldReduceMotion = useReducedMotion()

  const paletteKey = useMemo(() => palette.map(p => p.cssValue).join('|'), [palette])

  // Name → color lookup; only populated in UI mode
  const colorByName = useMemo(() => {
    if (!isUiMode) return new Map<string, (typeof palette)[0]>()
    return new Map(palette.map(c => [c.code, c]))
  }, [palette, isUiMode])

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

  useEffect(() => {
    if (!containerRef.current || paletteKey === previousPaletteKeyRef.current) return

    previousPaletteKeyRef.current = paletteKey

    const container = containerRef.current
    const swatches = Array.from(container.querySelectorAll('.swatch')) as HTMLElement[]

    const resolveColor = (i: number): string => {
      if (isUiMode) {
        return (colorByName.get(UI_LAYOUT[i]) ?? palette[0]).cssValue
      }
      const col = i % columns
      let colorIdx = Math.floor(col / columnsPerColor)
      if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
      return palette[colorIdx].cssValue
    }

    if (shouldReduceMotion) {
      swatches.forEach((el, i) => {
        el.style.backgroundColor = resolveColor(i)
      })
      return
    }

    const updates: Array<{ el: HTMLElement; color: string; delay: number }> = []
    swatches.forEach((el, i) => {
      const col = i % columns
      const row = Math.floor(i / columns)
      updates.push({ el, color: resolveColor(i), delay: (row + col) * 0.01 })
    })

    requestAnimationFrame(() => {
      updates.forEach(({ el, delay }) => {
        el.style.transition = `background-color 0.2s ease-out ${delay}s`
      })
      requestAnimationFrame(() => {
        updates.forEach(({ el, color }) => {
          el.style.backgroundColor = color
        })
      })
    })
  }, [paletteKey, columns, columnsPerColor, colorsCount, palette, shouldReduceMotion, isUiMode, colorByName])

  return (
    <div
      style={{ '--columns': columns, '--rows': rows } as React.CSSProperties}
      className="swatch-container"
      onClick={handleClick}
      ref={containerRef}
    >
      {Array.from({ length: totalSquares }).map((_, i) => {
        let color
        if (isUiMode) {
          color = colorByName.get(UI_LAYOUT[i]) ?? palette[0]
        } else {
          const col = i % columns
          let colorIdx = Math.floor(col / columnsPerColor)
          if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
          color = palette[colorIdx]
        }

        return (
          <div
            key={i}
            className="swatch"
            data-color={color.conversions[colorSpace.format].value}
            style={{ backgroundColor: color.cssValue }}
          />
        )
      })}
    </div>
  )
})
