import { Palettes, BaseColorData } from '../types'

export function useBaseColor(palettes: Palettes): BaseColorData {
  return palettes.com.og[0]
}
