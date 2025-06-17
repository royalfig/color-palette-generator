import Color, { Coords } from 'colorjs.io'
import { ColorFormat } from '../types'

export type BaseColorData = {
  code: `${string}-${number}`
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
): BaseColorData {
  const color = base instanceof Color ? base : new Color(base)
  return {
    code: `${paletteInformation}-${idx + 1}`,
    base,
    color,
    colorSpace: color.spaceId,
    cssValue: color.display().toString(),
    contrast: color.contrastWCAG21('#fff') > color.contrastWCAG21('#000') ? '#fff' : '#000',
    string: color.toString({ format }),
    fallback: color.to('srgb').toString({ clip: true, format }),
    conversions: {
      hex: {
        value: color.to('srgb').toString({ format: 'hex' }),
        isInGamut: color.inGamut('srgb'),
        coords: color.to('srgb').coords,
      },
      rgb: {
        value: color.to('srgb').toString(),
        isInGamut: color.inGamut('srgb'),
        coords: color.to('srgb').coords,
      },
      hsl: {
        value: color.to('hsl').toString(),
        isInGamut: color.inGamut('hsl'),
        coords: color.to('hsl').coords,
      },
      lch: {
        value: color.to('lch').toString(),
        isInGamut: color.inGamut('lch'),
        coords: color.to('lch').coords,
      },
      oklch: {
        value: color.to('oklch').toString(),
        isInGamut: color.inGamut('oklch'),
        coords: color.to('oklch').coords,
      },
      lab: {
        value: color.to('lab').toString(),
        isInGamut: color.inGamut('lab'),
        coords: color.to('lab').coords,
      },
      oklab: {
        value: color.to('oklab').toString(),
        isInGamut: color.inGamut('oklab'),
        coords: color.to('oklab').coords,
      },
      p3: {
        value: color.to('p3').toString(),
        isInGamut: color.inGamut('p3'),
        coords: color.to('p3').coords,
      },
    },
  }
}
