import { createContext } from 'react'
import type { Theme, PaletteKind, PaletteStyle, Mode } from '@/types'
import { type ThemeFormat } from '@royalfig/color-palette-pro'

import type { BaseColorData, CodeThemeOutput } from '@royalfig/color-palette-pro'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  paletteKind: PaletteKind
  setPaletteKind: (kind: PaletteKind) => void
  paletteStyle: PaletteStyle
  setPaletteStyle: (style: PaletteStyle) => void
  baseColor: string
  setBaseColor: (color: string) => void
  activeTheme: CodeThemeOutput
  themePair: { light: CodeThemeOutput; dark: CodeThemeOutput }
  uiVarsPair: {
    light: { css: string; palette: BaseColorData[] }
    dark: { css: string; palette: BaseColorData[] }
  }
  palette: BaseColorData[]
  mode: Mode
  setMode: (mode: Mode) => void
  formats: ThemeFormat[]
  setFormats: (format: ThemeFormat[]) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
