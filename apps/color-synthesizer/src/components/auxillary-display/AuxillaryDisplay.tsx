import { useAnimate } from 'motion/react'
import { useContext, useEffect, useMemo } from 'react'
import Color from 'colorjs.io'
import type { ColorFormat, ColorSpace, CodeThemeOutput } from '@royalfig/color-palette-pro'
import { BaseColorData } from '@royalfig/color-palette-pro'
import { ColorHistory } from '../color-history/ColorHistory'
import { ColorContext } from '../ColorContext'
import { Swatches } from '../swatches/Swatches'
import './PaletteDetails.css'
import { MessageContext } from '../MessageContext'

// 10 rows × 24 columns = 240 cells. Each row is one semantic family; each cell
// in a family is sized so the row's spans sum to 24.
const UI_TOKEN_LAYOUT: { code: string; span: number }[] = [
  // Row 0 — surface family (8 + 8 + 8)
  { code: 'surface', span: 8 },
  { code: 'on-surface', span: 8 },
  { code: 'on-surface-variant', span: 8 },
  // Row 1 — container ladder (8 + 8 + 8)
  { code: 'container', span: 8 },
  { code: 'container-sunken', span: 8 },
  { code: 'container-overlay', span: 8 },
  // Row 2 — outline (12 + 12)
  { code: 'outline', span: 12 },
  { code: 'outline-variant', span: 12 },
  // Row 3 — primary family (6 × 4)
  { code: 'primary', span: 6 },
  { code: 'on-primary', span: 6 },
  { code: 'primary-container', span: 6 },
  { code: 'on-primary-container', span: 6 },
  // Row 4 — secondary family
  { code: 'secondary', span: 6 },
  { code: 'on-secondary', span: 6 },
  { code: 'secondary-container', span: 6 },
  { code: 'on-secondary-container', span: 6 },
  // Row 5 — tertiary family
  { code: 'tertiary', span: 6 },
  { code: 'on-tertiary', span: 6 },
  { code: 'tertiary-container', span: 6 },
  { code: 'on-tertiary-container', span: 6 },
  // Row 6 — inverse (12 + 12)
  { code: 'inverse-surface', span: 12 },
  { code: 'on-inverse-surface', span: 12 },
  // Row 7 — error family
  { code: 'error', span: 6 },
  { code: 'on-error', span: 6 },
  { code: 'error-container', span: 6 },
  { code: 'on-error-container', span: 6 },
  // Row 8 — success family
  { code: 'success', span: 6 },
  { code: 'on-success', span: 6 },
  { code: 'success-container', span: 6 },
  { code: 'on-success-container', span: 6 },
  // Row 9 — warning family
  { code: 'warning', span: 6 },
  { code: 'on-warning', span: 6 },
  { code: 'warning-container', span: 6 },
  { code: 'on-warning-container', span: 6 },
]

function PaletteDetails({
  palette,
  colorNames,
  colorSpace,
  mode,
}: {
  palette: BaseColorData[]
  colorNames: string[]
  colorSpace: { space: ColorSpace; format: ColorFormat }
  mode: 'palette' | 'ui' | 'code'
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
      animate(el as HTMLElement, { opacity: 1 }, { type: 'spring', stiffness: 100, damping: 10, delay: i * 0.03 })
    })
  }, [palette])

  // UI mode: 24×10 semantically-grouped grid, label-only rendering.
  if (mode === 'ui') {
    const byCode = new Map(palette.map(c => [c.code, c]))
    return (
      <div className="palette-details palette-details-ui" ref={scope}>
        {UI_TOKEN_LAYOUT.map(({ code, span }) => {
          const color = byCode.get(code)
          if (!color) return null
          return (
            <div
              key={code}
              style={
                {
                  '--bg': color.cssValue,
                  '--color': color.contrast,
                  gridColumn: `span ${span}`,
                } as React.CSSProperties
              }
              className="palette-detail"
              data-color-value={color.conversions[colorSpace.format].value}
              onClick={handleColorClick}
            >
              <p>{code}</p>
            </div>
          )
        })}
      </div>
    )
  }

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

function contrastHex(hex: string): string {
  try {
    const c = new Color(hex)
    const l = c.oklch.l ?? 0.5
    return l > 0.5 ? '#000000' : '#ffffff'
  } catch {
    return '#000000'
  }
}

type CodeTokenRow = { label: string; value: string }

function codeThemeKeyTokens(theme: CodeThemeOutput): CodeTokenRow[] {
  const scopes: Record<string, string> = {}
  for (const rule of theme.tokenColors) {
    const fg = rule.settings.foreground
    if (!fg) continue
    const scopeList = Array.isArray(rule.scope) ? rule.scope : [rule.scope || '']
    for (const s of scopeList) {
      if (s && !scopes[s]) scopes[s] = fg
    }
  }
  const colors = theme.colors
  return [
    { label: 'Editor BG', value: colors['editor.background'] || '#1e1e1e' },
    { label: 'Editor FG', value: colors['editor.foreground'] || '#d4d4d4' },
    { label: 'Sidebar', value: colors['sideBar.background'] || '#181818' },
    { label: 'Status Bar', value: colors['statusBar.background'] || '#007acc' },
    { label: 'Focus', value: colors['focusBorder'] || '#007acc' },
    { label: 'Input', value: colors['input.background'] || '#1e1e1e' },
    { label: 'Comment', value: scopes['comment'] || '#6a9955' },
    { label: 'Definition', value: scopes['entity.name.function'] || '#569cd6' },
    { label: 'Keyword', value: scopes['keyword'] || '#c586c0' },
    { label: 'String', value: scopes['string'] || '#ce9178' },
    { label: 'Number', value: scopes['constant.numeric'] || '#b5cea8' },
    { label: 'Type', value: scopes['entity.name.type'] || scopes['support.type'] || '#4ec9b0' },
  ]
}

function CodeThemeDetails({ codeTheme }: { codeTheme: CodeThemeOutput }) {
  const { showMessage } = useContext(MessageContext)
  const [scope, animate] = useAnimate()
  const tokens = useMemo(() => codeThemeKeyTokens(codeTheme), [codeTheme])

  useEffect(() => {
    if (!scope.current) return
    Array.from(scope.current.querySelectorAll('.palette-detail')).forEach((el, i) => {
      animate(el as HTMLElement, { opacity: 1 }, { type: 'spring', stiffness: 100, damping: 10, delay: i * 0.05 })
    })
  }, [codeTheme])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const value = e.currentTarget.dataset.colorValue
    if (!value) return
    try {
      showMessage('Color copied', 'success')
      navigator.clipboard.writeText(value)
    } catch (error) {
      console.error('Failed to copy color value:', error)
    }
  }

  return (
    <div
      className="palette-details"
      ref={scope}
      style={{ '--items': Math.min(tokens.length / 2, 6) } as React.CSSProperties}
    >
      {tokens.map(token => (
        <div
          key={token.label}
          style={{ '--bg': token.value, '--color': contrastHex(token.value) } as React.CSSProperties}
          className="palette-detail"
          data-color-value={token.value}
          onClick={handleClick}
        >
          <p>{token.label}</p>
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

  const { palette, mode, codeTheme } = context

  if (showPaletteColors) {
    if (mode === 'code' && codeTheme) {
      return <CodeThemeDetails codeTheme={codeTheme} />
    }
    return <PaletteDetails palette={palette} colorNames={colorNames} colorSpace={colorSpace} mode={mode} />
  }
  if (showColorHistory) {
    return <ColorHistory setColor={setColor} colorHistory={colorHistory} setColorHistory={setColorHistory} />
  }
  return <Swatches colorSpace={colorSpace} paletteType={paletteType} paletteStyle={paletteStyle} />
}
