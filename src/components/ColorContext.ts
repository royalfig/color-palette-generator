import { createContext } from 'react'
import type { BaseColorData } from '../util/factory'

export type ColorContextType = {
  originalColor: string
  palette: BaseColorData[]
}

export const ColorContext = createContext<ColorContextType>({
  originalColor: '', // dummy, will never be used
  palette: [],
})
