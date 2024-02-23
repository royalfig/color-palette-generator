import Color from 'colorjs.io'

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

export type BaseColorData = {
  code: `${string}-${number}`
  hex: ColorObj
  rgb: ColorObj
  hsl: ColorObj
  lch: ColorObj
  oklch: ColorObj
  lab: ColorObj
  oklab: ColorObj
  p3: ColorObj
}

export type VariationKinds = 'og' | 'keel' | 'film' | 'cloud' | 'fire'

export type Variations = {
  [key in VariationKinds]: BaseColorData[]
}

export type PaletteKinds = 'ana' | 'tri' | 'tet' | 'com' | 'spl' | 'ton' | 'pol' | 'tas'

export type Palettes = {
  [key in PaletteKinds]: Variations
}
