import { createContext } from 'react'
import { BaseColorData } from '../util/factory'
import Color from 'colorjs.io'

type ColorContextType = {
  color: string
  palette: BaseColorData[]
  colorObj: Color
}
export const ColorContext = createContext<ColorContextType | null>(null)
