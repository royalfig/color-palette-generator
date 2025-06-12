import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { detectFormat, clampOKLCH } from './utils'

export function generateTones(
  baseColor: string,
  options: {
    style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'
  },
) {
  const { style } = options
  const format = detectFormat(baseColor)

  try {
    const baseColorObj = new Color(baseColor)

    // Handle achromatic colors - create lightness variations instead
    if (isNaN(baseColorObj.oklch.h) || baseColorObj.oklch.c < 0.01) {
      return generateGrayscaleTones(baseColorObj, format)
    }

    const colors: BaseColorData[] = []

    // Define chroma progression (12 steps from most saturated to least)
    let chromaSteps: number[]

    switch (style) {
      case 'mathematical':
        chromaSteps = getMathematicalTones(baseColorObj.oklch.c)
        break
      case 'optical':
        chromaSteps = getVisuallyPleasingTones(baseColorObj.oklch.c)
        break
      case 'adaptive':
        chromaSteps = getAdaptiveTones(baseColorObj)
        break
      case 'warm-cool':
        chromaSteps = getWarmCoolTones(baseColorObj)
        break
    }

    chromaSteps.forEach((chroma, index) => {
      if (index === 0) {
        // Most saturated version (might be more than base)
        if (chroma === baseColorObj.oklch.c) {
          colors.push(colorFactory(baseColor, 'tones', index, format))
          return
        }
      }

      // Apply style-specific adjustments
      let adjustedLightness = baseColorObj.oklch.l
      let adjustedHue = baseColorObj.oklch.h || 0

      if (style === 'optical' || style === 'adaptive' || style === 'warm-cool') {
        const adjustments = getLightnessHueAdjustmentsForTones(
          chroma,
          baseColorObj.oklch.c,
          baseColorObj.oklch.l,
          baseColorObj.oklch.h || 0,
          style,
        )
        adjustedLightness = adjustments.lightness
        adjustedHue = adjustments.hue
      }

      const values = clampOKLCH(adjustedLightness, chroma, adjustedHue)

      const color = baseColorObj.clone()
      color.oklch.l = values.l
      color.oklch.c = values.c
      color.oklch.h = values.h

      colors.push(colorFactory(color, 'tones', index, format))
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate tones for ${baseColor}: ${e}`)
  }
}

function getMathematicalTones(baseChroma: number): number[] {
  // Linear progression from max to zero
  const maxChroma = Math.min(0.37, baseChroma * 1.2) // Slightly more than base
  return [
    maxChroma,
    maxChroma * 0.9,
    maxChroma * 0.8,
    maxChroma * 0.7,
    maxChroma * 0.6,
    maxChroma * 0.5,
    maxChroma * 0.4,
    maxChroma * 0.3,
    maxChroma * 0.2,
    maxChroma * 0.1,
    maxChroma * 0.05,
    0, // Pure gray
  ]
}

function getVisuallyPleasingTones(baseChroma: number): number[] {
  // Non-linear curve that looks more natural
  const maxChroma = Math.min(0.37, baseChroma * 1.15)

  return [
    maxChroma, // Most saturated
    maxChroma * 0.85, // High saturation
    maxChroma * 0.72, // Medium-high
    maxChroma * 0.6, // Medium
    maxChroma * 0.5, // Medium-low
    maxChroma * 0.4, // Lower
    maxChroma * 0.32, // Muted
    maxChroma * 0.25, // Very muted
    maxChroma * 0.18, // Subtle
    maxChroma * 0.12, // Very subtle
    maxChroma * 0.06, // Almost gray
    0, // Pure gray
  ]
}

function getAdaptiveTones(baseColor: Color): number[] {
  const oklch = baseColor.to('oklch')
  const baseChroma = oklch.c

  // Adapt based on color properties
  let maxChroma = Math.min(0.37, baseChroma * 1.1)

  // High lightness colors can handle more saturation variation
  if (oklch.l > 0.7) {
    maxChroma = Math.min(0.37, baseChroma * 1.3)
  }

  // Very saturated colors get more dramatic progression
  if (baseChroma > 0.2) {
    return [
      maxChroma,
      maxChroma * 0.8,
      maxChroma * 0.65,
      maxChroma * 0.5,
      maxChroma * 0.38,
      maxChroma * 0.28,
      maxChroma * 0.2,
      maxChroma * 0.14,
      maxChroma * 0.1,
      maxChroma * 0.06,
      maxChroma * 0.03,
      0,
    ]
  }

  // Lower saturation colors get gentler progression
  return getVisuallyPleasingTones(baseChroma)
}

function getWarmCoolTones(baseColor: Color): number[] {
  // Same chroma progression as visually pleasing
  return getVisuallyPleasingTones(baseColor.oklch.c)
}

function getLightnessHueAdjustmentsForTones(
  targetChroma: number,
  baseChroma: number,
  baseLightness: number,
  baseHue: number,
  style: string,
): { lightness: number; hue: number } {
  const chromaRatio = baseChroma > 0 ? targetChroma / baseChroma : 0

  if (style === 'optical' || style === 'adaptive') {
    // As colors become less saturated, they can appear lighter
    const lightnessAdjust = (1 - chromaRatio) * 0.05 // Subtle lightness increase

    return {
      lightness: Math.min(0.99, baseLightness + lightnessAdjust),
      hue: baseHue,
    }
  }

  if (style === 'warm-cool') {
    // As saturation decreases, shift slightly toward neutral temperature
    const isWarm = baseHue < 180
    const hueShift = (1 - chromaRatio) * (isWarm ? -3 : 3) // Slight shift toward neutral
    const lightnessAdjust = (1 - chromaRatio) * 0.03

    return {
      lightness: Math.min(0.99, baseLightness + lightnessAdjust),
      hue: (baseHue + hueShift + 360) % 360,
    }
  }

  // Mathematical: no adjustments
  return { lightness: baseLightness, hue: baseHue }
}

function generateGrayscaleTones(
  baseColor: Color,
  format: 'hex' | 'rgb' | 'hsl' | 'oklch' | 'oklab' | 'lch' | 'lab' | 'p3' | undefined,
): BaseColorData[] {
  // For grays, create lightness variations since there's no chroma to adjust
  const baseLightness = baseColor.oklch.l
  const variations = [0, 0.05, 0.1, 0.15, 0.08, 0.03, -0.03, -0.08, -0.15, -0.2, -0.25, -0.3]

  return variations.map((lightAdj, index) => {
    if (index === 0 && lightAdj === 0) {
      return colorFactory(baseColor, 'tones', index, format)
    }

    const gray = baseColor.clone()
    const values = clampOKLCH(baseLightness + lightAdj, 0, 0)
    gray.oklch.l = values.l

    return colorFactory(gray, 'tones', index, format)
  })
}
