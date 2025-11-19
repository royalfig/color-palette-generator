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

type ConversionData = {
  value: string
  isInGamut: boolean
  coords: number[]
}

type ConversionsCache = {
  [key: string]: ConversionData | undefined
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
    [key: string]: ConversionData
  }
  fallback: string
}

/**
 * Creates a conversion getter that lazily computes and caches color space conversions.
 * This significantly improves performance by only computing conversions when they're actually accessed.
 */
function createLazyConversion(
  color: Color,
  space: string,
  format: ColorFormat,
  cache: ConversionsCache,
): ConversionData {
  // Helper to ensure conversion is computed and cached
  const ensureCached = () => {
    if (!cache[space]) {
      const convertedColor = color.to(space as any)
      const inGamut = convertedColor.toGamut()
      const coords = inGamut.coords.map(n => toPrecision(n, 3))
      cache[space] = {
        value: inGamut.toString({ precision: 3 }),
        isInGamut: color.inGamut(space as any),
        coords,
      }
    }
    return cache[space]!
  }

  return {
    get value() {
      return ensureCached().value
    },
    get isInGamut() {
      return ensureCached().isInGamut
    },
    get coords() {
      return ensureCached().coords
    },
  } as ConversionData
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

  // Conversion cache for lazy-loaded conversions
  const conversionCache: ConversionsCache = {}

  // Always compute hex and hsl upfront (most commonly used)
  // Convert to srgb once and reuse for hex/rgb
  const srgbColor = color.to('srgb')
  const srgbInGamut = srgbColor.toGamut()
  const srgbCoords = srgbInGamut.coords.map(n => toPrecision(n, 3))
  conversionCache.hex = {
    value: srgbInGamut.toString({ format: 'hex' }),
    isInGamut: color.inGamut('srgb'),
    coords: srgbCoords,
  }
  conversionCache.rgb = {
    value: srgbInGamut.toString({ precision: 3 }),
    isInGamut: color.inGamut('srgb'),
    coords: srgbCoords,
  }

  // Convert to hsl once (commonly used for UI components)
  const hslColor = color.to('hsl')
  const hslInGamut = hslColor.toGamut()
  const hslCoords = hslInGamut.coords.map(n => toPrecision(n, 3))
  conversionCache.hsl = {
    value: hslInGamut.toString({ precision: 3 }),
    isInGamut: color.inGamut('hsl'),
    coords: hslCoords,
  }

  // Lazy-load other conversions (oklch, lch, lab, oklab, p3)
  // These are only computed when accessed, saving significant computation time

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
      hex: conversionCache.hex,
      rgb: conversionCache.rgb,
      hsl: conversionCache.hsl,
      // Lazy-loaded conversions - only computed when accessed
      lch: createLazyConversion(color, 'lch', format, conversionCache),
      oklch: createLazyConversion(color, 'oklch', format, conversionCache),
      lab: createLazyConversion(color, 'lab', format, conversionCache),
      oklab: createLazyConversion(color, 'oklab', format, conversionCache),
      p3: createLazyConversion(color, 'p3', format, conversionCache),
    },
  }
}
