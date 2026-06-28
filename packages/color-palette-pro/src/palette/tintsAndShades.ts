import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from '../factory'
import { ColorFormat, ColorSpace } from '../types/types'

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
    const baseLightness = baseColorObj.oklch.l ?? 0.5

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
      colors.push(...generateTriangleStyle(baseColorObj, lightnessProgression))
    } else if (style === 'circle') {
      // Chroma storytelling - dark=rich, light=ethereal
      colors.push(...generateCircleStyle(baseColorObj))
    } else if (style === 'diamond') {
      // Tonal variations using color mixing
      colors.push(...generateDiamondStyle(baseColorObj, lightnessProgression))
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
    throw new Error(`Failed to generate tints and shades for ${baseColor}`, {
      cause: e,
    })
  }
}

// Square Style: Pure numerical consistency
function generateSquareStyle(baseColor: Color, lightnesses: number[], baseIndex: number): Color[] {
  const colors: Color[] = []
  const baseChroma = baseColor.oklch.c ?? 0
  const baseHue = baseColor.oklch.h ?? 0

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
function generateTriangleStyle(baseColor: Color, lightnesses: number[]): Color[] {
  const colors: Color[] = []
  const baseChroma = baseColor.oklch.c ?? 0
  const baseHue = baseColor.oklch.h ?? 0
  const baseLightness = baseColor.oklch.l ?? 0.5

  lightnesses.forEach(targetLightness => {
    const color = baseColor.clone()
    const lightnessDelta = targetLightness - baseLightness
    const isShade = lightnessDelta < 0
    const distance = Math.abs(lightnessDelta)

    // Apply Bezold-Brücke shift compensation
    let hueShift = getBezoldBruckeCompensation(baseHue, lightnessDelta)

    // Apply chroma adjustment based on lightness
    let chromaMultiplier: number
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

// Circle style intentionally ignores the shared `lightnesses`/`baseIndex` progression: it uses
// colorjs `steps()` toward white and black to build its own perceptually-even ramp with natural
// chroma falloff at the extremes. The params are kept only for a uniform dispatch signature. (5.2)
function generateCircleStyle(baseColor: Color): Color[] {
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
function generateDiamondStyle(baseColor: Color, lightnesses: number[]): Color[] {
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

// Approximate perceptual hue-drift functions.
//
// These *mimic* the Bezold–Brücke (hue shifts with luminance) and Abney (hue shifts with
// desaturation) effects. Real B–B/Abney are non-linear and defined for near-spectral stimuli,
// not broadband sRGB tints — so we don't claim precision. Compared to the previous version
// (hard per-hue-band steps with arbitrary gains, covering only part of the wheel and producing
// discontinuities at the band edges) these are smooth, bounded, and defined for *every* hue,
// so a tint ramp drifts consistently no matter the base hue. (Audit 3B.)

/** Subtle luminance-driven hue drift (≤~4°), continuous across the wheel. */
function getBezoldBruckeCompensation(hue: number, lightnessDelta: number): number {
  if (!Number.isFinite(hue)) return 0
  // Smoothly varies sign with hue: ~max near yellow (90°), opposite near blue (270°).
  const phase = Math.cos(((hue - 90) * Math.PI) / 180)
  return lightnessDelta * phase * 4
}

/** Subtle desaturation-driven hue drift (≤~2°), continuous across the wheel. */
function getAbneyCompensation(hue: number, chromaReduction: number): number {
  if (!Number.isFinite(hue)) return 0
  const phase = Math.sin(((hue - 30) * Math.PI) / 180)
  return chromaReduction * phase * 15
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

  // Snap the nearest slot to the base lightness so the base appears exactly in the ramp — but
  // clamp it between its neighbors so the progression stays strictly increasing. Writing the
  // raw base L unconditionally could put the slot out of order (a non-monotone ramp). (Audit 5.1.)
  const lower = closestIndex > 0 ? progression[closestIndex - 1] + 0.005 : 0
  const upper = closestIndex < progression.length - 1 ? progression[closestIndex + 1] - 0.005 : 1
  progression[closestIndex] = Math.max(lower, Math.min(upper, baseLightness))
  return closestIndex
}
