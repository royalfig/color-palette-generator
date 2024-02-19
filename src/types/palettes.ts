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

export type ColorFactory = {
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

export type ColorScheme = {
  original: ColorFactory[]
  keel: ColorFactory[]
  cinematic: ColorFactory[]
  languid: ColorFactory[]
  sharkbite: ColorFactory[]
}

export type Schemes = {
  ana: ColorScheme
  tria: ColorScheme
  tetra: ColorScheme
  comp: ColorScheme
  split: ColorScheme
  tones: ColorScheme
  poly: ColorScheme
  tints: ColorScheme
}