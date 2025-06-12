import { createContext } from 'react'
import { BaseColorData } from '../util/factory'

type ColorContextType = {
  currentPalette: BaseColorData[]
  currentColor: BaseColorData
}
export const ColorContext = createContext<ColorContextType | null>(null)
