import Color, { Coords } from 'colorjs.io'
import { ColorFormat } from '../types'

export type BaseColorData = {
  code: `${string}-${number}`
  isBase: boolean
  base: string | Color
  color: Color
  colorSpace: string
  cssValue: string
  contrast: string
  string: string
  conversions: {
    [key: string]: {
      value: string
      isInGamut: boolean
      coords: Coords
    }
  }
  fallback: string
}

export function colorFactory(
  base: string | Color,
  paletteInformation: string,
  idx = 0,
  format: ColorFormat,
  isBase = false,
): BaseColorData {
  const color = base instanceof Color ? base : new Color(base)
  return {
    code: `${paletteInformation}-${idx + 1}`,
    isBase,
    base,
    color,
    colorSpace: color.spaceId,
    cssValue: color.display().toString(),
    contrast: color.contrastWCAG21('#fff') > color.contrastWCAG21('#000') ? '#fff' : '#000',
    string: color.toString({ format, precision: 3 }),
    fallback: color.to('srgb').toString({ clip: true, format }),
    conversions: {
      hex: {
        value: color.to('srgb').toString({ format: 'hex' }),
        isInGamut: color.inGamut('srgb'),
        coords: color.to('srgb').coords,
      },
      rgb: {
        value: color.to('srgb').toString({ precision: 3 }),
        isInGamut: color.inGamut('srgb'),
        coords: color.to('srgb').coords,
      },
      hsl: {
        value: color.to('hsl').toString({ precision: 3 }),
        isInGamut: color.inGamut('hsl'),
        coords: color.to('hsl').coords,
      },
      lch: {
        value: color.to('lch').toString({ precision: 3 }),
        isInGamut: color.inGamut('lch'),
        coords: color.to('lch').coords,
      },
      oklch: {
        value: color.to('oklch').toString({ precision: 3 }),
        isInGamut: color.inGamut('oklch'),
        coords: color.to('oklch').coords,
      },
      lab: {
        value: color.to('lab').toString({ precision: 3 }),
        isInGamut: color.inGamut('lab'),
        coords: color.to('lab').coords,
      },
      oklab: {
        value: color.to('oklab').toString({ precision: 3 }),
        isInGamut: color.inGamut('oklab'),
        coords: color.to('oklab').coords,
      },
      p3: {
        value: color.to('p3').toString({ precision: 3 }),
        isInGamut: color.inGamut('p3'),
        coords: color.to('p3').coords,
      },
    },
  }
}
