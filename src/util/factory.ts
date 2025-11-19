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
  
  // Optimize: Reuse converted color objects to avoid redundant conversions
  // Convert to srgb once and reuse for hex/rgb
  const srgbColor = color.to('srgb')
  const srgbInGamut = srgbColor.toGamut()
  const srgbCoords = srgbInGamut.coords.map(n => toPrecision(n, 3))
  
  // Convert to hsl once
  const hslColor = color.to('hsl')
  const hslInGamut = hslColor.toGamut()
  const hslCoords = hslInGamut.coords.map(n => toPrecision(n, 3))
  
  // Convert to oklch once
  const oklchColor = color.to('oklch')
  const oklchInGamut = oklchColor.toGamut()
  const oklchCoords = oklchInGamut.coords.map(n => toPrecision(n, 3))
  
  // Convert to lch once
  const lchColor = color.to('lch')
  const lchInGamut = lchColor.toGamut()
  const lchCoords = lchInGamut.coords.map(n => toPrecision(n, 3))
  
  // Convert to lab once
  const labColor = color.to('lab')
  const labInGamut = labColor.toGamut()
  const labCoords = labInGamut.coords.map(n => toPrecision(n, 3))
  
  // Convert to oklab once
  const oklabColor = color.to('oklab')
  const oklabInGamut = oklabColor.toGamut()
  const oklabCoords = oklabInGamut.coords.map(n => toPrecision(n, 3))
  
  // Convert to p3 once
  const p3Color = color.to('p3')
  const p3InGamut = p3Color.toGamut()
  const p3Coords = p3InGamut.coords.map(n => toPrecision(n, 3))
  
  return {
    code: isUiMode ? paletteInformation : `${paletteInformation}-${idx + 1}`,
    isBase,
    base,
    color,
    colorSpace: color.spaceId,
    cssValue: color.display().toString(),
    contrast: color.contrastWCAG21('#fff') > color.contrastWCAG21('#000') ? '#fff' : '#000',
    string: color.toString({ format, precision: 3 }),
    fallback: srgbInGamut.toString({ clip: true, format }),
    conversions: {
      hex: {
        value: srgbInGamut.toString({ format: 'hex' }),
        isInGamut: color.inGamut('srgb'),
        coords: srgbCoords,
      },
      rgb: {
        value: srgbInGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut('srgb'),
        coords: srgbCoords,
      },
      hsl: {
        value: hslInGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut('hsl'),
        coords: hslCoords,
      },
      lch: {
        value: lchInGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut('lch'),
        coords: lchCoords,
      },
      oklch: {
        value: oklchInGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut('oklch'),
        coords: oklchCoords,
      },
      lab: {
        value: labInGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut('lab'),
        coords: labCoords,
      },
      oklab: {
        value: oklabInGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut('oklab'),
        coords: oklabCoords,
      },
      p3: {
        value: p3InGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut('p3'),
        coords: p3Coords,
      },
    },
  }
}
