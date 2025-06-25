import { createContext } from 'react'
import { colorFactory, type BaseColorData } from '../util/factory'

export type ColorContextType = {
  originalColor: BaseColorData
  palette: BaseColorData[]
}

export const ColorContext = createContext<ColorContextType>({
  originalColor: colorFactory('red', 'base', 0, 'hex'), // dummy, will never be used
  palette: [],
})
