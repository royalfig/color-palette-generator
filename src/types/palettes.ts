import Color from 'colorjs.io'
import { BaseColorData } from '../util/factory'

export type ColorObj = {
  base: Color
  string: string
  css: string
  isInGamut: boolean
  contrast: string
  raw: number[]
  fallback: string
  outOfGamut: string
}

export type BaseColorData2 = {
  color: Color
  conversions: {
    [key: string]: { Color: Color; css: string; outOfSRGB: boolean }
  }
  contrastColor: 'black' | 'white'
  raw: number[]
  fallback: string
  outOfSRGB: boolean
  css: string
}

export type VariationKinds = 'og' | 'keel' | 'film' | 'cloud' | 'fire'

export type Variations = {
  [key in VariationKinds]: BaseColorData[]
}

export type PaletteKinds = 'ana' | 'tri' | 'tet' | 'com' | 'spl' | 'ton' | 'pol' | 'tas'

export type Palettes = {
  [key in PaletteKinds]: Variations
}
