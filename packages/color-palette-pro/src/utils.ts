import Color from 'colorjs.io'
import { colorFactory, BaseColorData } from './factory'
import { ColorFormat } from './types'

export function detectFormat(str: string): 'hex' | undefined {
  if (str.startsWith('#')) return 'hex'

  // Add more as needed
  return undefined
}

const OKLCH_LIMITS = {
  l: { min: 0.01, max: 0.99 }, // Avoid pure black/white
  c: { min: 0, max: 0.37 }, // Conservative chroma limit
  h: { min: 0, max: 360 }, // Hue wraps naturally
}

export function clampOKLCH(l: number, c: number, h: number) {
  return {
    l: Math.max(OKLCH_LIMITS.l.min, Math.min(OKLCH_LIMITS.l.max, l)),
    c: Math.max(OKLCH_LIMITS.c.min, Math.min(OKLCH_LIMITS.c.max, c)),
    h: ((h % 360) + 360) % 360, // Wrap hue properly
  }
}

export function applyVariation(
  baseColor: Color,
  variation: { l: number; c: number },
  hue: number,
): Color {
  const values = clampOKLCH(
    (baseColor.oklch.l ?? 0.5) + variation.l,
    (baseColor.oklch.c ?? 0) * variation.c,
    hue,
  )
  const result = baseColor.clone()
  result.oklch.l = values.l
  result.oklch.c = values.c
  result.oklch.h = values.h
  return result
}

export function getRandBetween() {
  return Math.floor(Math.random() * 100) + 1
}

export function hex3to6(color: Color) {
  const hex = color.toString({ format: 'hex' }).substring(1)

  if (hex.length === 3) {
    const [a, b, c] = hex
    return a + a + b + b + c + c
  }

  return hex
}

export function createSlug(str: string) {
  return str.split(' ')[0].toLowerCase().replace(/\W/, '-')
}

export function isLight(color: Color) {
  const l = color.oklch.l

  if (l !== null && l >= 0.5) {
    return true
  }

  return false
}

export function buildPaletteColors(
  baseColor: string,
  finalColors: Color[],
  paletteType: string,
  format: ColorFormat,
): BaseColorData[] {
  return finalColors.map((color, index) =>
    index === 0
      ? colorFactory(baseColor, paletteType, index, format, true)
      : colorFactory(color, paletteType, index, format),
  )
}
