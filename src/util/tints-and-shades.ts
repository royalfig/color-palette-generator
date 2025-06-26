import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { ColorFormat } from '../types'
import { ColorSpace } from '../types'

export function generateTintsAndShades(
  baseColor: string,
  options: {
    style: 'square' | 'triangle' | 'circle' | 'diamond'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { style } = options
  const format = options.colorSpace.format

  try {
    const baseColorObj = new Color(baseColor)
    const baseLightness = baseColorObj.oklch.l

    // Generate 12 lightness values from darkest to lightest
    const lightnessProgression = getLightnessProgression(baseLightness, style)

    // Find where the base color should be positioned
    const baseIndex = findBaseColorPosition(baseLightness, lightnessProgression)

    const colors: Color[] = []

    // Different generation strategies for each style
    if (style === 'square') {
      // Pure numerical consistency
      colors.push(...generateSquareStyle(baseColorObj, lightnessProgression, baseIndex))
    } else if (style === 'triangle') {
      // Perceptual compensation for Bezold-Brücke and Abney effects
      colors.push(...generateTriangleStyle(baseColorObj, lightnessProgression, baseIndex))
    } else if (style === 'circle') {
      // Chroma storytelling - dark=rich, light=ethereal
      colors.push(...generateCircleStyle(baseColorObj, lightnessProgression, baseIndex))
    } else if (style === 'diamond') {
      // Tonal variations using color mixing
      colors.push(...generateDiamondStyle(baseColorObj, lightnessProgression, baseIndex))
    }

    // Convert to your color factory format
    const results: BaseColorData[] = []
    colors.forEach((color, index) => {
      if (index === baseIndex) {
        results.push(colorFactory(color, 'tints-shades', index, format, true))
      } else {
        results.push(colorFactory(color, 'tints-shades', index, format))
      }
    })

    return results
  } catch (e) {
    throw new Error(`Failed to generate tints and shades for ${baseColor}: ${e}`)
  }
}

// Square Style: Pure numerical consistency
function generateSquareStyle(baseColor: Color, lightnesses: number[], baseIndex: number): Color[] {
  const colors: Color[] = []
  const baseChroma = baseColor.oklch.c
  const baseHue = baseColor.oklch.h || 0

  lightnesses.forEach((lightness, index) => {
    if (index === baseIndex) {
      colors.push(baseColor.clone())
    } else {
      const color = baseColor.clone()
      color.oklch.l = lightness
      color.oklch.c = baseChroma
      color.oklch.h = baseHue
      colors.push(color)
    }
  })

  return colors
}

// Triangle Style: Perceptual compensation
function generateTriangleStyle(baseColor: Color, lightnesses: number[], baseIndex: number): Color[] {
  const colors: Color[] = []
  const baseChroma = baseColor.oklch.c
  const baseHue = baseColor.oklch.h || 0
  const baseLightness = baseColor.oklch.l

  lightnesses.forEach((targetLightness, index) => {
    const color = baseColor.clone()
    const lightnessDelta = targetLightness - baseLightness
    const isShade = lightnessDelta < 0
    const distance = Math.abs(lightnessDelta)

    // Apply Bezold-Brücke shift compensation
    let hueShift = getBezoldBruckeCompensation(baseHue, lightnessDelta)

    // Apply chroma adjustment based on lightness
    let chromaMultiplier = 1.0
    if (isShade) {
      // Darker colors can handle more chroma
      chromaMultiplier = 1.0 + distance * 0.4
    } else {
      // Lighter colors need less chroma
      chromaMultiplier = 1.0 - distance * 0.6

      // Apply Abney effect compensation for desaturated colors
      const chromaReduction = baseChroma * (1 - chromaMultiplier)
      hueShift += getAbneyCompensation(baseHue, chromaReduction)
    }

    color.oklch.l = targetLightness
    color.oklch.c = Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier))
    color.oklch.h = (baseHue + hueShift + 360) % 360

    colors.push(color)
  })

  return colors
}

// Circle Style: Chroma storytelling
function generateCircleStyle2(baseColor: Color, lightnesses: number[], baseIndex: number): Color[] {
  const colors: Color[] = []
  const baseChroma = baseColor.oklch.c
  const baseHue = baseColor.oklch.h || 0

  // Create a chroma curve that peaks in shadows and valleys in highlights
  const chromaCurve = (lightness: number) => {
    // Exponential curve that favors darker values
    const darkness = 1 - lightness
    const chromaBoost = Math.pow(darkness, 1.5) * 0.8 + 0.2
    return baseChroma * chromaBoost * 1.2 // Allow up to 20% over base chroma in darks
  }

  lightnesses.forEach((lightness, index) => {
    const color = baseColor.clone()
    color.oklch.l = lightness

    // Apply the chroma curve
    const targetChroma = chromaCurve(lightness)
    color.oklch.c = Math.max(0, Math.min(0.37, targetChroma))

    // Minimal hue adjustment for cohesion
    const hueShift = (lightness - 0.5) * 2 // -1 to 1 degree
    color.oklch.h = (baseHue + hueShift + 360) % 360

    colors.push(color)
  })

  return colors
}

function generateCircleStyle(baseColor: Color, lightnesses: number[], baseIndex: number): Color[] {
  const whiteSteps = baseColor.steps('white', {
    space: 'oklch',
    outputSpace: 'oklch',
    maxDeltaE: 0, // max deltaE between consecutive steps (optional)
    steps: 8, // min number of steps
  })

  const blackSteps = baseColor.steps('black', {
    space: 'oklch',
    outputSpace: 'oklch',
    maxDeltaE: 0, // max deltaE between consecutive steps (optional)
    steps: 8, // min number of steps
  })

  const blackStepsReversed = blackSteps.slice(1, -1).reverse()
  const innerWhiteSteps = whiteSteps.slice(1, -1)
  return [...blackStepsReversed, ...innerWhiteSteps]
}

// Diamond Style: Tonal variations using color mixing
function generateDiamondStyle(baseColor: Color, lightnesses: number[], baseIndex: number): Color[] {
  const steps = baseColor.steps('gray', {
    space: 'oklch',
    outputSpace: 'oklch',
    maxDeltaE: 0, // max deltaE between consecutive steps (optional)
    steps: 12, // min number of steps
  })

  const colors: Color[] = []
  lightnesses.forEach((lightness, index) => {
    const color = steps[index]
    color.oklch.l = lightness
    colors.push(color)
  })

  return colors
}

// Perceptual compensation functions
function getBezoldBruckeCompensation(hue: number, lightnessDelta: number): number {
  // Bezold-Brücke shift compensation
  let shift = 0

  if (hue >= 220 && hue <= 280) {
    // Blues
    // Blues shift toward red when darker
    shift = lightnessDelta * -8
  } else if (hue >= 60 && hue <= 90) {
    // Yellows
    // Yellows shift toward green when darker
    shift = lightnessDelta * -5
  } else if ((hue >= 0 && hue <= 30) || hue >= 330) {
    // Reds
    // Reds shift toward yellow when lighter
    shift = lightnessDelta * 3
  } else if (hue >= 150 && hue <= 200) {
    // Cyans
    // Cyans shift toward blue when darker
    shift = lightnessDelta * -4
  }

  return shift
}

function getAbneyCompensation(hue: number, chromaReduction: number): number {
  // Abney effect compensation (for desaturation)
  let shift = 0

  if (hue >= 280 && hue <= 320) {
    // Purples
    // Purples shift toward red when desaturated
    shift = chromaReduction * -40
  } else if (hue >= 180 && hue <= 210) {
    // Cyans
    // Cyans shift toward blue when desaturated
    shift = chromaReduction * -30
  } else if (hue >= 90 && hue <= 120) {
    // Yellow-greens
    // Yellow-greens shift toward yellow when desaturated
    shift = chromaReduction * -20
  }

  return shift
}

// Lightness progression
function getLightnessProgression(baseLightness: number, style: string): number[] {
  const baseProgression = [
    0.02, // Abyss
    0.08, // Deep shadow
    0.16, // Shadow
    0.26, // Dark
    0.38, // Medium dark
    0.42, // Medium dark
    0.5, // Medium
    0.62, // Medium light
    0.74, // Light
    0.84, // Bright
    0.91, // Very bright
    0.98, // White
  ]

  // Style-specific lightness adjustments
  if (style === 'triangle') {
    // Slightly compressed for perceptual uniformity
    return baseProgression.map((l, i) => {
      if (i < 3) return l + 0.02 // Lift deepest shadows
      if (i > 9) return l - 0.01 // Lower highlights
      return l
    })
  }

  if (style === 'circle') {
    // More dramatic range for chroma storytelling
    return baseProgression.map((l, i) => {
      if (i === 0) return 0.01 // Deeper black for max chroma
      if (i === 11) return 0.99 // Brighter white
      return l
    })
  }

  // if (style === 'diamond') {
  //   // Tonal compression for mixing
  //   return
  // }

  return baseProgression
}

function findBaseColorPosition(baseLightness: number, progression: number[]): number {
  let closestIndex = 0
  let closestDifference = Math.abs(progression[0] - baseLightness)

  for (let i = 1; i < progression.length; i++) {
    const difference = Math.abs(progression[i] - baseLightness)
    if (difference < closestDifference) {
      closestDifference = difference
      closestIndex = i
    }
  }

  progression[closestIndex] = baseLightness
  return closestIndex
}
