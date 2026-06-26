import { useReducedMotion } from 'motion/react'
import React, { useContext, useMemo, useRef, memo, useEffect } from 'react'
import Color from 'colorjs.io'
import type { ColorFormat, ColorSpace } from '@royalfig/color-palette-pro'
import { ColorContext } from '../ColorContext'
import { MessageContext } from '../MessageContext'
import './swatches.css'

const UI_LAYOUT: string[] = [
  ...Array(24).fill('surface'),
  'surface', ...Array(23).fill('container'),
  'surface', 'container', ...Array(9).fill('on-surface'), 'container',
  ...Array(11).fill('container-sunken'), 'container',
  'surface', ...Array(11).fill('container'),
  ...Array(2).fill('container-sunken'), 'outline', ...Array(8).fill('container-sunken'), 'container',
  'surface', 'container', ...Array(7).fill('on-surface-variant'), ...Array(3).fill('container'),
  'container-sunken', ...Array(3).fill('outline'),
  ...Array(3).fill('container-sunken'), 'outline', ...Array(3).fill('container-sunken'), 'container',
  'surface', 'container', ...Array(5).fill('on-surface-variant'), ...Array(5).fill('container'),
  ...Array(5).fill('outline'), ...Array(2).fill('container-sunken'),
  ...Array(3).fill('outline'), 'container-sunken', 'container',
  'surface', ...Array(11).fill('container'),
  ...Array(6).fill('outline'), 'container-sunken', ...Array(4).fill('outline'), 'container',
  'surface', ...Array(11).fill('container'),
  ...Array(11).fill('outline'), 'container',
  'surface', 'container',
  ...Array(4).fill('primary'), 'container', ...Array(4).fill('secondary'), 'container',
  ...Array(11).fill('outline'), 'container',
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
  const totalSquares = 240
  const columns = 24
  const rows = 10
  const colorsCount = context.palette.length
  const columnsPerColor = Math.floor(columns / colorsCount)
  const { showMessage } = useContext(MessageContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousPaletteKeyRef = useRef<string>('')
  const previousModeRef = useRef<string>('')
  const shouldReduceMotion = useReducedMotion()

  const paletteKey = useMemo(() => context.palette.map(p => p.cssValue).join('|'), [context.palette])

  const colorByName = useMemo(() => {
    if (context.mode !== 'ui') return new Map<string, (typeof context.palette)[0]>()
    return new Map(context.palette.map(c => [c.code, c]))
  }, [context.palette, context.mode])

  // Derive token colors from the actual generated theme's tokenColors rules
  const codeTokenMap = useMemo(() => {
    if (context.mode !== 'code') return null
    const theme = context.codeTheme
    if (!theme) return null

    // Build a map of scope patterns -> foreground colors from the generated theme
    const scopes: Record<string, string> = {}
    for (const rule of theme.tokenColors) {
      const foreground = rule.settings.foreground
      if (!foreground) continue
      const scopeList = Array.isArray(rule.scope) ? rule.scope : [rule.scope || '']
      for (const scope of scopeList) {
        if (scope && !scopes[scope]) {
          scopes[scope] = foreground
        }
      }
    }

    const uiColors: Record<string, string> = {
      surface: theme.colors['editor.background'] || '#1e1e1e',
      defaultForeground: theme.colors['editor.foreground'] || '#d4d4d4',
      comment: scopes['comment'] || '',
      definition: scopes['entity.name.function'] || '',
      string: scopes['string'] || '',
      number: scopes['constant.numeric'] || '',
      keyword: scopes['keyword'] || '',
      type: scopes['entity.name.type'] || '',
    }

    return { scopes, uiColors }
  }, [context.codeTheme, context.mode])

  // Layout mimics a JS function with left/right bg margins and a blank row between every code line
  // tk1=comment  tk2=definition  tk3=string  tk4=number  tk5=fg  tk6=keyword  tk7=type
  const codeLayout = useMemo(() => {
    if (!codeTokenMap) return null

    const layout: string[] = []

    // Row 0: top margin
    for (let i = 0; i < 24; i++) layout.push('bg')

    // Row 1: bg(2)  // comment  bg(12)
    layout.push('bg','bg', ...Array(10).fill('tk1'), ...Array(12).fill('bg'))

    // Row 2: blank
    for (let i = 0; i < 24; i++) layout.push('bg')

    // Row 3: bg(2)  export function greet(name: string) {  bg(0)
    layout.push('bg','bg', 'tk6','tk6', 'bg', 'tk6','tk6', 'bg', 'tk2','tk2', 'bg', 'tk5','tk5', 'bg', 'tk7','tk7', 'bg', 'tk5', 'tk5', 'bg', 'tk5', 'bg', 'tk5', 'bg')

    // Row 4: blank
    for (let i = 0; i < 24; i++) layout.push('bg')

    // Row 5: bg(4 = margin+indent)  const msg = 'Hi' + 42  bg(4)
    layout.push('bg','bg','bg','bg', 'tk6','tk6', 'bg', 'tk5','tk5', 'bg', 'tk5', 'bg', 'tk3','tk3','tk3', 'bg', 'tk5', 'bg', 'tk4','tk4', ...Array(4).fill('bg'))

    // Row 6: blank
    for (let i = 0; i < 24; i++) layout.push('bg')

    // Row 7: bg(4 = margin+indent)  return msg + 1  bg(11)
    layout.push('bg','bg','bg','bg', 'tk6','tk6', 'bg', 'tk5','tk5', 'bg', 'tk5', 'bg', 'tk4', ...Array(11).fill('bg'))

    // Row 8: bg(2)  }  bg(21)
    layout.push('bg','bg', 'tk5', ...Array(21).fill('bg'))

    // Row 9: bottom margin
    for (let i = 0; i < 24; i++) layout.push('bg')

    return layout
  }, [codeTokenMap])

  const codeColors = useMemo(() => {
    if (!codeLayout || !codeTokenMap) return null
    const { uiColors } = codeTokenMap

    // mapping to actual theme semantic colors
    const colorMap: Record<string, string> = {
      bg: uiColors.surface,
      tk1: uiColors.comment || '#6a9955',
      tk2: uiColors.definition || '#569cd6',
      tk3: uiColors.string || '#ce9178',
      tk4: uiColors.number || '#b5cea8',
      tk5: uiColors.defaultForeground || '#d4d4d4',
      tk6: uiColors.keyword || '#c586c0',
      tk7: uiColors.type || '#4ec9b0',
    }

    return colorMap
  }, [codeLayout, codeTokenMap])

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
    if (!containerRef.current || (paletteKey === previousPaletteKeyRef.current && context.mode === previousModeRef.current)) return

    previousPaletteKeyRef.current = paletteKey
    previousModeRef.current = context.mode

    const container = containerRef.current
    const swatches = Array.from(container.querySelectorAll('.swatch')) as HTMLElement[]

    const resolveColor = (i: number): string => {
      if (context.mode === 'ui') {
        return (colorByName.get(UI_LAYOUT[i]) ?? context.palette[0]).cssValue
      }
      if (context.mode === 'code' && codeColors) {
        const token = codeLayout?.[i] || 'bg'
        return codeColors[token] || codeColors.bg
      }
      const col = i % columns
      let colorIdx = Math.floor(col / columnsPerColor)
      if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
      return context.palette[colorIdx].cssValue
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
  }, [paletteKey, columns, columnsPerColor, colorsCount, context.palette, shouldReduceMotion, context.mode, colorByName, codeColors, codeLayout])

  return (
    <div
      style={{ '--columns': columns, '--rows': rows } as React.CSSProperties}
      className="swatch-container"
      onClick={handleClick}
      ref={containerRef}
    >
      {Array.from({ length: totalSquares }).map((_, i) => {
        let color
        if (context.mode === 'ui') {
          color = colorByName.get(UI_LAYOUT[i]) ?? context.palette[0]
        } else if (context.mode === 'code' && codeColors && codeLayout) {
          const token = codeLayout[i] || 'bg'
          const hex = codeColors[token] || codeColors.bg
          let colorValue = hex
          if (colorSpace.format !== 'hex') {
            try { colorValue = new Color(hex).toString({ format: colorSpace.format as any, precision: 3 }) } catch { /* keep hex */ }
          }
          return (
            <div
              key={i}
              className="swatch"
              data-color={colorValue}
              style={{ backgroundColor: hex }}
            />
          )
        } else {
          const col = i % columns
          let colorIdx = Math.floor(col / columnsPerColor)
          if (colorIdx >= colorsCount) colorIdx = colorsCount - 1
          color = context.palette[colorIdx]
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
