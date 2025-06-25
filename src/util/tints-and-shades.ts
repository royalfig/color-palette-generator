import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat } from '../types'
import { ColorSpace } from '../types'
import { avoidMuddyZones, applyEnhancementsToTintsShades } from './enhancer'

export function generateTintsAndShades(
  baseColor: string,
  options: {
    style: 'square' | 'triangle' | 'circle' | 'diamond'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { style } = options
  const enhanced = style === 'square' ? false : true
  const format = options.colorSpace.format

  try {
    const baseColorObj = new Color(baseColor)
    const baseLightness = baseColorObj.oklch.l

    // Generate 12 lightness values from darkest to lightest
    const lightnessProgression = getLightnessProgression(baseLightness, style, baseColorObj)

    // Find where the base color should be positioned
    const baseIndex = findBaseColorPosition(baseLightness, lightnessProgression)

    const initialColors: Color[] = []

    lightnessProgression.forEach((targetLightness, index) => {
      // Apply style-specific chroma and hue adjustments
      const adjustments = adjustChroma(baseColorObj.oklch.c, style, index, baseIndex)
      console.log(adjustments.chroma, index)
      // Apply muddy zone avoidance if enhanced mode
      let finalChroma = adjustments.chroma
      let finalHue = baseColorObj.oklch.h
      let finalLightness = index === baseIndex ? baseLightness : targetLightness

      // if (enhanced) {
      //   const cleaned = avoidMuddyZones(finalHue, finalLightness, finalChroma)
      //   finalHue = baseColorObj.oklch.h
      //   finalLightness = cleaned.l
      //   finalChroma = cleaned.c
      // }

      const values = clampOKLCH(finalLightness, finalChroma, finalHue)

      const color = baseColorObj.clone()
      color.oklch.l = values.l
      color.oklch.c = values.c
      color.oklch.h = values.h

      initialColors.push(color)
    })

    // Convert to your color factory format
    const colors: BaseColorData[] = []
    initialColors.forEach((color, index) => {
      if (index === baseIndex) {
        colors.push(colorFactory(baseColor, 'tints-shades', index, format, true))
      } else {
        colors.push(colorFactory(color, 'tints-shades', index, format))
      }
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate tints and shades for ${baseColor}: ${e}`)
  }
}

// Unified lightness progression system
function getLightnessProgression(baseLightness: number, style: string, baseColor: Color): number[] {
  // All styles use the same base progression
  // The differences come from chroma and micro-hue adjustments
  const baseProgression = [
    0.02, // Abyss
    0.08, // Deep shadow
    0.16, // Shadow
    0.26, // Dark
    0.38, // Medium dark
    0.5, // Medium
    0.62, // Medium light
    0.74, // Light
    0.84, // Bright
    0.91, // Very bright
    0.96, // Near white
    0.98, // White
  ]

  // Slight style-specific tweaks for character
  if (style === 'triangle') {
    // Compress shadows slightly for perceptual uniformity
    return baseProgression.map((l, i) => {
      if (i < 4) return l * 0.99 // Lighten deepest shadows slightly
      if (i > 8) return l * 0.99 // Darken highlights slightly
      return l
    })
  }

  if (style === 'circle') {
    // More dramatic range for emotional impact
    return baseProgression.map((l, i) => {
      if (i === 0) return 0.01 // Deeper black
      if (i === 11) return 0.99 // Brighter white
      return l
    })
  }

  if (style === 'diamond') {
    return baseProgression.map((l, i) => {
      if (i < 4) return l * 0.75 // Lighten deepest shadows slightly
      if (i > 8) return l * 1.2 // Darken highlights slightly
      return l
    })
  }

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

function adjustChroma(baseChroma: number, style: string, index: number, baseIndex: number): { chroma: number } {
  const isShade = index < 6
  const distanceFromBase = Math.abs(index - 6)
  const normalizedDistance = distanceFromBase / 11 // 0 to 1
  // debugger
  if (style === 'square') {
    // Pure tints/shades - no adjustments
    return { chroma: baseChroma }
  }

  let chromaMultiplier = 1.0

  if (style === 'triangle') {
    // Perceptual: How pigments actually behave
    if (isShade) {
      // Shades: Chroma increases slightly (pigment concentration)
      chromaMultiplier = 1.0 + normalizedDistance * 0.6
    } else {
      // Tints: Chroma decreases (dilution with white)
      chromaMultiplier = 1.0 - normalizedDistance * 0.9 // Up to 60% reduction
    }
  }

  if (style === 'circle') {
    // Emotional storytelling through chroma modulation
    if (isShade) {
      // Shades tell a story of depth and mystery
      if (distanceFromBase <= 2) {
        // Near shades: Rich and intense
        chromaMultiplier = 1.0 + normalizedDistance * 0.4
      } else if (distanceFromBase <= 4) {
        // Mid shades: Moody
        chromaMultiplier = 1.0 + normalizedDistance * 0.2
      } else {
        // Deep shades: Mysterious, lower chroma
        chromaMultiplier = 1.0 - normalizedDistance * 0.3
      }
    } else {
      // Tints tell a story of light and air
      if (distanceFromBase <= 2) {
        // Near tints: Maintain presence
        chromaMultiplier = 1.0 - normalizedDistance * 0.3
      } else if (distanceFromBase <= 4) {
        // Mid tints: Ethereal
        chromaMultiplier = 1.0 - normalizedDistance * 0.5
      } else {
        // High tints: Whisper of color
        chromaMultiplier = 1.0 - normalizedDistance * 0.7
      }
    }
  }

  if (style === 'diamond') {
    // Temperature story through chroma, not hue
    if (isShade) {
      // Cool shadows through chroma modulation
      chromaMultiplier = 1.0 + normalizedDistance * 0.25
      // TINY hue shift for temperature hint
    } else {
      // Warm highlights through chroma reduction
      chromaMultiplier = 1.0 - normalizedDistance * 0.5
      // TINY hue shift for temperature hint
    }
  }
  console.log(chromaMultiplier, index)
  // Apply adjustments with safety limits
  const finalChroma = Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier))

  return { chroma: finalChroma }
}

// Additional helper for creating distinct palettes while preserving identity
export function createTintsAndShadesVariations(
  baseColor: string,
  options: {
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
): {
  square: BaseColorData[]
  triangle: BaseColorData[]
  circle: BaseColorData[]
  diamond: BaseColorData[]
} {
  return {
    square: generateTintsAndShades(baseColor, {
      ...options,
      style: 'square',
    }),
    triangle: generateTintsAndShades(baseColor, {
      ...options,
      style: 'triangle',
    }),
    circle: generateTintsAndShades(baseColor, {
      ...options,
      style: 'circle',
    }),
    diamond: generateTintsAndShades(baseColor, {
      ...options,
      style: 'diamond',
    }),
  }
}
