import Color from 'colorjs.io'
import { colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'

function getMathematicalAnalogous(hue: number): number[] {
  // Pure mathematical - rigid 30° steps
  return [
    (hue - 60 + 360) % 360,
    (hue - 30 + 360) % 360,
    hue, // base
    hue,
    (hue + 30) % 360,
    (hue + 60) % 360,
  ]
}

function getWarmCoolAnalogous(hue: number): number[] {
  // Organic spacing - varies by color temperature
  const isWarm = hue < 180
  const spacing = isWarm ? 25 : 35 // Warmer colors closer together

  return [
    (hue - spacing * 2 + 360) % 360,
    (hue - spacing + 360) % 360,
    hue,
    hue,
    (hue + spacing) % 360,
    (hue + spacing * 2) % 360,
  ]
}

function getVisuallyPleasingAnalogous(hue: number): number[] {
  // Adobe-style with curved progression
  if (hue >= 0 && hue < 60) {
    // Reds: tighter spacing to avoid muddy oranges
    return [(hue - 40 + 360) % 360, (hue - 20 + 360) % 360, hue, hue, (hue + 15) % 360, (hue + 35) % 360]
  }
  if (hue >= 60 && hue < 120) {
    // Yellows: wider spacing for more variety
    return [(hue - 50 + 360) % 360, (hue - 25 + 360) % 360, hue, hue, (hue + 25) % 360, (hue + 50) % 360]
  }
  if (hue >= 240 && hue < 300) {
    // Blues: moderate spacing
    return [(hue - 35 + 360) % 360, (hue - 18 + 360) % 360, hue, hue, (hue + 18) % 360, (hue + 35) % 360]
  }

  // Default spacing for other hues
  return [(hue - 40 + 360) % 360, (hue - 20 + 360) % 360, hue, hue, (hue + 20) % 360, (hue + 40) % 360]
}

function getAdaptiveAnalogous(baseColor: Color): number[] {
  const oklch = baseColor.to('oklch')
  const hue = oklch.h

  // Adapt spacing based on color properties
  let spacing = 30 // base spacing

  // High chroma colors can handle wider spacing
  if (oklch.c > 0.2) spacing *= 1.3

  // Very light/dark colors need tighter harmony
  if (oklch.l > 0.85 || oklch.l < 0.25) spacing *= 0.7

  // Avoid problematic hue ranges (muddy colors)
  if (hue >= 30 && hue < 90) spacing *= 0.8 // Yellow-orange range

  return [
    (hue - spacing * 1.5 + 360) % 360,
    (hue - spacing * 0.7 + 360) % 360,
    hue,
    hue,
    (hue + spacing * 0.7) % 360,
    (hue + spacing * 1.5) % 360,
  ]
}

export function generateAnalogous(
  baseColor: string,
  options: {
    chromaAdjust?: number
    style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'
  },
) {
  const { chromaAdjust = 0.9, style } = options
  const format = detectFormat(baseColor)

  try {
    const baseColorObj = new Color(baseColor)

    // Handle achromatic colors
    if (isNaN(baseColorObj.oklch.h) || baseColorObj.oklch.c < 0.01) {
      return generateMonochromaticFallback(baseColorObj, format)
    }

    let analogousHues: number[]

    switch (style) {
      case 'mathematical':
        analogousHues = getMathematicalAnalogous(baseColorObj.oklch.h)
        break
      case 'optical':
        analogousHues = getVisuallyPleasingAnalogous(baseColorObj.oklch.h)
        break
      case 'adaptive':
        analogousHues = getAdaptiveAnalogous(baseColorObj)
        break
      case 'warm-cool':
        analogousHues = getWarmCoolAnalogous(baseColorObj.oklch.h)
        break
    }

    // Create color variations with different lightness/chroma
    const variations = [
      { l: 0.15, c: 0.8 }, // Darker, less saturated
      { l: -0.05, c: 0.9 }, // Slightly darker
      { l: 0, c: 1.0 }, // Base color
      { l: 0, c: 1.0 }, // Base color
      { l: 0.1, c: 0.85 }, // Lighter
      { l: 0.2, c: 0.7 }, // Much lighter, less saturated
    ]

    return analogousHues.map((hue, index) => {
      const color = baseColorObj.clone()

      if (index === 3) {
        if (color.oklch.l > 0.5) {
          const values = clampOKLCH(baseColorObj.oklch.l * 0.9, baseColorObj.oklch.c, hue)
          color.oklch.l = values.l
          color.oklch.c = values.c
          color.oklch.h = values.h
          return colorFactory(color, 'analogous', index, format)
        }
        const values = clampOKLCH(baseColorObj.oklch.l * 1.1, baseColorObj.oklch.c, hue)
        color.oklch.l = values.l
        color.oklch.c = values.c
        color.oklch.h = values.h
        return colorFactory(color, 'analogous', index, format)
      }

      const variation = variations[index]
      const values = clampOKLCH(baseColorObj.oklch.l + variation.l, baseColorObj.oklch.c * variation.c, hue)
      color.oklch.l = values.l
      color.oklch.c = values.c
      color.oklch.h = values.h

      return colorFactory(color, 'analogous', index, format)
    })
  } catch (e) {
    throw new Error(`Failed to generate analogous colors for ${baseColor}: ${e}`)
  }
}

function generateMonochromaticFallback(
  baseColor: Color,
  format: 'hex' | 'rgb' | 'hsl' | 'oklch' | 'oklab' | 'lch' | 'lab' | 'p3' | undefined,
): string[] {
  // For grays, create lightness variations
  const variations = [0.6, 0.8, 1.0, 1.2, 1.4, 1.6]

  return variations.map((mult, index) => {
    const color = baseColor.clone()
    const values = clampOKLCH(baseColor.oklch.l * mult, baseColor.oklch.c, baseColor.oklch.h || 0)

    color.oklch.l = values.l
    return colorFactory(color, 'analogous', index, format).string
  })
}
