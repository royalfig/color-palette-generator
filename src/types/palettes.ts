import Color from 'colorjs.io'

export type ColorObj = {
    base: Color;
    string: string;
    css: string;
    isInGamut: boolean;
    contrast: string;
    raw: number[];
    fallback: string;
    outOfGamut: string;
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

export type Variations = {
  og: BaseColorData[]
  keel: BaseColorData[]
  film: BaseColorData[]
  cloud: BaseColorData[]
  fire: BaseColorData[]
}

export type Palettes = {
  ana: Variations
  tri: Variations
  tet: Variations
  com: Variations
  spl: Variations
  ton: Variations
  pol: Variations
  tas: Variations
}