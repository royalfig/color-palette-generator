import { ColorFactory, colorFactory } from './factory'
import { createScales } from './scales'
import { createColorObj, ReturnColor } from './colorParse'
import { ColorConstructor } from 'colorjs.io/types/src/color'
import Color from 'colorjs.io'

const targetHues: { [key: string]: number[] } = {
  analogous: [0, 40, 70],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  complementary: [0, 180],
  splitComplementary: [0, 150, 210],
}

function cinematic(color: Color) {
  color.hsl.s *= 1.2;
  if (color.hsl.l > 0.5) {
    color.hsl.l *= 0.9;
  } else {
    color.hsl.l *= 1.1;
  }
  return color;
}

function languid(color: Color) {
  color.hsl.s *= .5;
  color.hsl.l *= 1.25;
  return color;
}

function sharkbite(color: Color) {
  color.hsl.s *= 1.5;
  color.hsl.l *= 1.25;
  return color;
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

export function createPalettes(baseColor: string | Color): Schemes {
  console.log("🚀 ~ file: palettes.ts:85 ~ createPalettes ~ baseColor:", baseColor)
  const palettes = Object.keys(targetHues).reduce<Record<string, any>>((hueAcc, hueKey) => {
    const v = Object.keys(variations).reduce<Record<string, any>>((variationAcc, variationKey) => {
      const p = targetHues[hueKey].map((hue, idx) => {
        const space = variations[variationKey].space
        const base = new Color(baseColor)
        if (space === 'hsl') {
          base.hsl.h += hue; 
          const variedColor = variations[variationKey].adjust(base, idx)
          return colorFactory(variedColor, `${hueKey}-${variationKey}`, idx)
        } else {
          base.lch.h += hue;
          const variedColor = variations[variationKey].adjust(base, idx)
          return colorFactory(variedColor, `${hueKey}-${variationKey}`, idx)
        }

      })

      variationAcc[variationKey] = [...p]
      return variationAcc
    }, {})

    hueAcc[hueKey] = v
    return hueAcc
  }, {})

  const scales = createScales(baseColor)
  console.log("🚀 ~ file: palettes.ts:111 ~ createPalettes ~ scales:", scales)
  return { ...palettes, ...scales } as Schemes
}
