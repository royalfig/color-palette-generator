import { createContext } from 'react'
import { colorFactory, type BaseColorData } from '@royalfig/color-palette-pro'
import type { CodeThemeOutput } from '@royalfig/color-palette-pro'

export type ColorContextType = {
  originalColor: BaseColorData
  palette: BaseColorData[]
  mode: 'palette' | 'ui' | 'code'
  codeTheme?: CodeThemeOutput
  isDarkMode: boolean
}

export const ColorContext = createContext<ColorContextType>({
  originalColor: colorFactory('red', 'base', 0, 'hex'), // dummy, will never be used
  palette: [],
  mode: 'palette',
  isDarkMode: false,
})
