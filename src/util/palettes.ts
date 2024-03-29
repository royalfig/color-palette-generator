import Color from 'colorjs.io'
import { Palettes } from '../types'
import { colorFactory } from './factory'
import { createScales } from './scales'

const targetHues: { [key: string]: number[] } = {
  com: [0, 180],
  ana: [0, 35, 70],
  spl: [0, 150, 210],
  tri: [0, 120, 240],
  tet: [0, 90, 180, 270],
}

function film(color: Color) {
  color.hsl.s *= 1.2
  if (color.hsl.l > 0.5) {
    color.hsl.l *= 0.9
  } else {
    color.hsl.l *= 1.1
  }
  return color
}

function cloud(color: Color) {
  color.hsl.s *= 0.5
  color.hsl.l *= 1.25
  return color
}

function fire(color: Color) {
  color.hsl.s *= 1.5
  color.hsl.l *= 1.25
  return color
}

const variations: { [key: string]: { space: string; adjust: Function } } = {
  og: {
    space: 'hsl',
    adjust: (color: Color) => color,
  },
  keel: {
    space: 'oklch',
    adjust: (color: Color) => color,
  },
  film: {
    space: 'hsl',
    adjust: (color: Color) => film(color),
  },
  cloud: {
    space: 'hsl',
    adjust: (color: Color) => cloud(color),
  },
  fire: {
    space: 'hsl',
    adjust: (color: Color) => fire(color),
  },
}

function adjustHue(val: number) {
  if (val < 0) val += Math.ceil(-val / 360) * 360
  return val % 360
}


function createColorVariations(hueKey: string, variationKey: string, baseColor: string | Color) {
  return targetHues[hueKey].map((hue, idx) => {
    // 0, 30  & 0, 1, 2
    const space = variations[variationKey].space
    const base = new Color(baseColor)
    if (space === 'hsl') {
      base.hsl.h = adjustHue(base.hsl.h + hue)
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
export function createPalettes(baseColor: string | Color): Palettes {
  const palettes = Object.keys(targetHues).reduce<Record<string, any>>((hueAcc, hueKey) => {
    // hueAcc = {schemes} & hueKey = 'ana'
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
  const ui = createUi(palettes as Palettes, scales)
  return { ...palettes, ...scales } as Palettes
}

function createUi(palettes: Palettes, scales) {
  const isLight = palettes.com.keel[0].lch.raw[0] > 50
  const l = 50 - (palettes.com.keel[0].lch.raw[0] - 50)

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
