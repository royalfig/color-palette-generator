import { ColorFactory, colorFactory } from './factory'
import { generateCss } from './generateCss'
import { createScales } from './scales'
import Color from 'colorjs.io'

const targetHues: { [key: string]: number[] } = {
  analogous: [0, 40, 70],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  complementary: [0, 180],
  splitComplementary: [0, 150, 210],
}

function cinematic(color: Color) {
  color.hsl.s *= 1.2
  if (color.hsl.l > 0.5) {
    color.hsl.l *= 0.9
  } else {
    color.hsl.l *= 1.1
  }
  return color
}

function languid(color: Color) {
  color.hsl.s *= 0.5
  color.hsl.l *= 1.25
  return color
}

function sharkbite(color: Color) {
  color.hsl.s *= 1.5
  color.hsl.l *= 1.25
  return color
}

const variations: { [key: string]: { space: string; adjust: Function } } = {
  original: {
    space: 'hsl',
    adjust: (color: Color) => color,
  },
  keel: {
    space: 'oklch',
    adjust: (color: Color) => color,
  },
  cinematic: {
    space: 'hsl',
    adjust: (color: Color) => cinematic(color),
  },
  languid: {
    space: 'hsl',
    adjust: (color: Color) => languid(color),
  },
  sharkbite: {
    space: 'hsl',
    adjust: (color: Color) => sharkbite(color),
  },
}

function adjustHue(val: number) {
  if (val < 0) val += Math.ceil(-val / 360) * 360
  return val % 360
}

type ColorScheme = {
  original: ColorFactory[]
  keel: ColorFactory[]
  cinematic: ColorFactory[]
  languid: ColorFactory[]
  sharkbite: ColorFactory[]
}

export type Schemes = {
  analogous: ColorScheme
  triadic: ColorScheme
  tetradic: ColorScheme
  complementary: ColorScheme
  splitComplementary: ColorScheme
  tones: ColorScheme
  polychromia: ColorScheme
  tintsAndShades: ColorScheme
}

function createColorVariations(hueKey: string, variationKey: string, baseColor: string | Color) {
  return targetHues[hueKey].map((hue, idx) => {
    // 0, 30  & 0, 1, 2
    const space = variations[variationKey].space
    const base = new Color(baseColor)
    if (space === 'hsl') {
      base.hsl.h += hue
      const variedColor = variations[variationKey].adjust(base, idx)
      return colorFactory(variedColor, `${hueKey}-${variationKey}`, idx)
    } else {
      base.lch.h += hue
      const variedColor = variations[variationKey].adjust(base, idx)
      return colorFactory(variedColor, `${hueKey}-${variationKey}`, idx)
    }
  })
}

// TODO: is it possible to simplify this function?
export function createPalettes(baseColor: string | Color): Schemes {
  const palettes = Object.keys(targetHues).reduce<Record<string, any>>((hueAcc, hueKey) => {
    // hueAcc = {schemes} & hueKey = 'analogous'
    const v = Object.keys(variations).reduce<Record<string, any>>((variationAcc, variationKey) => {
      // hueAcc = {variations} & variationKey = 'original'
      const p = createColorVariations(hueKey, variationKey, baseColor)
      variationAcc[variationKey] = [...p]
      return variationAcc
    }, {})

    hueAcc[hueKey] = v
    return hueAcc
  }, {})

  const scales = createScales(baseColor)
  const ui = createUi(palettes as Schemes, scales)
  return { ...palettes, ...scales } as Schemes
}

function createUi(palettes: Schemes, scales) {
  const isLight = palettes.complementary.keel[0].lch.raw[0] > 50
  const l = 50 - (palettes.complementary.keel[0].lch.raw[0] - 50)

  return {
    dark: {
      primary: '',
      primaryLight: '',
      primaryDark: '',
      secondary: '',
      secondaryLight: '',
      secondaryDark: '',

      surface: '',
      surfaceLight: '',
      surfaceDark: '',

      element: '',
      elementLight: '',
      elementDark: '',

      success: '',
      error: '',
    },

    light: {
      primary: '',
      primaryLight: '',
      primaryDark: '',
      secondary: '',
      secondaryLight: '',
      secondaryDark: '',

      surface: '',
      surfaceLight: '',
      surfaceDark: '',

      element: '',
      elementLight: '',
      elementDark: '',

      success: '',
      error: '',
    },
  }
}
