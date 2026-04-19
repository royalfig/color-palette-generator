import { Palettes, BaseColorData } from '@royalfig/color-palette-pro'

export function useBaseColor(palettes: Palettes): BaseColorData {
  return palettes.com.og[0]
}
