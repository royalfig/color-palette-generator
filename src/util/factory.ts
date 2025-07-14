import Color, { Coords } from 'colorjs.io'
import { ColorFormat } from '../types'
function toPrecision(n: number, precision: number) {
  if (n === 0) {
    return 0
  }
  let integer = ~~n
  let digits = 0
  if (integer && precision) {
    digits = ~~Math.log10(Math.abs(integer)) + 1
  }
  const multiplier = 10.0 ** (precision - digits)
  return Math.floor(n * multiplier + 0.5) / multiplier
}
export type BaseColorData = {
  code: `${string}-${number}` | string
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
      coords: number[]
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
  isUiMode = false,
): BaseColorData {
  const color = base instanceof Color ? base : new Color(base)
  return {
    code: isUiMode ? paletteInformation : `${paletteInformation}-${idx + 1}`,
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
        coords: color
          .to('srgb')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
      rgb: {
        value: color.to('srgb').toString({ precision: 3 }),
        isInGamut: color.inGamut('srgb'),
        coords: color
          .to('srgb')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
      hsl: {
        value: color.to('hsl').toString({ precision: 3 }),
        isInGamut: color.inGamut('hsl'),
        coords: color
          .to('hsl')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
      lch: {
        value: color.to('lch').toString({ precision: 3 }),
        isInGamut: color.inGamut('lch'),
        coords: color
          .to('lch')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
      oklch: {
        value: color.to('oklch').toString({ precision: 3 }),
        isInGamut: color.inGamut('oklch'),
        coords: color
          .to('oklch')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
      lab: {
        value: color.to('lab').toString({ precision: 3 }),
        isInGamut: color.inGamut('lab'),
        coords: color
          .to('lab')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
      oklab: {
        value: color.to('oklab').toString({ precision: 3 }),
        isInGamut: color.inGamut('oklab'),
        coords: color
          .to('oklab')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
      p3: {
        value: color.to('p3').toString({ precision: 3 }),
        isInGamut: color.inGamut('p3'),
        coords: color
          .to('p3')
          .toGamut()
          .coords.map(n => toPrecision(n, 3)),
      },
    },
  }
}
