import { Palettes, BaseColorData } from 'color-palette-pro'

export function useBaseColor(palettes: Palettes): BaseColorData {
  return palettes.com.og[0]
}
