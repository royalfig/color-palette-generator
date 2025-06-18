import { createContext } from 'react'
import { BaseColorData } from '../util/factory'
import Color from 'colorjs.io'

type ColorContextType = {
  originalColor: string
  palette: BaseColorData[]
}
export const ColorContext = createContext<ColorContextType | null>(null)
