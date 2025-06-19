import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat } from '../types'
import { ColorSpace } from '../types'
import { avoidMuddyZones, applyEnhancementsToTintsShades } from './enhancer'

export function generateTintsAndShades(
  baseColor: string,
  options: {
    style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { style } = options
  const enhanced = style === 'mathematical' ? false : true
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
      if (index === baseIndex) {
        // Preserve the exact base color
        initialColors.push(new Color(baseColor))
        return
      }

      // Apply style-specific chroma and hue adjustments
      const adjustments = getStyleAdjustments(
        targetLightness,
        baseLightness,
        baseColorObj.oklch.c,
        baseColorObj.oklch.h || 0,
        style,
        index,
        baseIndex,
      )

      // Apply muddy zone avoidance if enhanced mode
      let finalChroma = adjustments.chroma
      let finalHue = baseColorObj.oklch.h
      let finalLightness = targetLightness

      if (enhanced) {
        const cleaned = avoidMuddyZones(finalHue, finalLightness, finalChroma)
        finalHue = baseColorObj.oklch.h
        finalLightness = cleaned.l
        finalChroma = cleaned.c
      }

      const values = clampOKLCH(finalLightness, finalChroma, finalHue)

      const color = baseColorObj.clone()
      color.oklch.l = values.l
      color.oklch.c = values.c
      color.oklch.h = values.h

      initialColors.push(color)
    })

    // Apply enhancements if enabled
    // const finalColors = enhanced ? applyEnhancementsToTintsShades(initialColors, style, baseIndex) : initialColors
    const finalColors = enhanced ? applyEnhancementsToTintsShades(initialColors, style, baseIndex) : initialColors

    // Convert to your color factory format
    const colors: BaseColorData[] = []
    finalColors.forEach((color, index) => {
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
  if (style === 'optical') {
    // Compress shadows slightly for perceptual uniformity
    return baseProgression.map((l, i) => {
      if (i < 4) return l * 1.1 // Lighten deepest shadows slightly
      if (i > 8) return l * 0.98 // Darken highlights slightly
      return l
    })
  }

  if (style === 'adaptive') {
    // More dramatic range for emotional impact
    return baseProgression.map((l, i) => {
      if (i === 0) return 0.01 // Deeper black
      if (i === 11) return 0.99 // Brighter white
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

function getStyleAdjustments(
  targetLightness: number,
  baseLightness: number,
  baseChroma: number,
  baseHue: number,
  style: string,
  index: number,
  baseIndex: number,
): { chroma: number; hue: number } {
  const isShade = index < baseIndex
  const distanceFromBase = Math.abs(index - baseIndex)
  const normalizedDistance = distanceFromBase / 11 // 0 to 1

  if (style === 'mathematical') {
    // Pure tints/shades - no adjustments
    return { chroma: baseChroma, hue: baseHue }
  }

  // MINIMAL HUE SHIFTS - Max 1-2 degrees
  let hueShift = 0
  let chromaMultiplier = 1.0

  if (style === 'optical') {
    // Perceptual: How pigments actually behave
    if (isShade) {
      // Shades: Chroma increases slightly (pigment concentration)
      chromaMultiplier = 1.0 + normalizedDistance * 0.3 // Up to 30% boost
      // Tiny cool shift (like adding black pigment)
      hueShift = -normalizedDistance * 1 // Max -1° shift
    } else {
      // Tints: Chroma decreases (dilution with white)
      chromaMultiplier = 1.0 - normalizedDistance * 0.6 // Up to 60% reduction
      // Micro warm shift (like adding white pigment)
      hueShift = normalizedDistance * 0.5 // Max +0.5° shift
    }
  }

  if (style === 'adaptive') {
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
      hueShift = -normalizedDistance * 1.5 // Max -1.5° shift
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
      hueShift = normalizedDistance * 1 // Max +1° shift
    }
  }

  if (style === 'warm-cool') {
    // Temperature story through chroma, not hue
    if (isShade) {
      // Cool shadows through chroma modulation
      chromaMultiplier = 1.0 + normalizedDistance * 0.25
      // TINY hue shift for temperature hint
      hueShift = -normalizedDistance * 2 // Max -2° toward cool
    } else {
      // Warm highlights through chroma reduction
      chromaMultiplier = 1.0 - normalizedDistance * 0.5
      // TINY hue shift for temperature hint
      hueShift = normalizedDistance * 1.5 // Max +1.5° toward warm
    }

    // Extra chroma boost for colors that need it
    if (baseHue >= 180 && baseHue <= 240) {
      // Blues benefit from extra chroma in shades
      if (isShade) chromaMultiplier *= 1.1
    } else if (baseHue >= 30 && baseHue <= 90) {
      // Yellows/oranges need chroma preservation in tints
      if (!isShade) chromaMultiplier *= 1.2
    }
  }

  // Apply adjustments with safety limits
  const finalChroma = Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier))
  const finalHue = (baseHue + hueShift + 360) % 360

  return { chroma: finalChroma, hue: baseHue }
}

// Additional helper for creating distinct palettes while preserving identity
export function createTintsAndShadesVariations(
  baseColor: string,
  options: {
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
): {
  mathematical: BaseColorData[]
  optical: BaseColorData[]
  adaptive: BaseColorData[]
  warmCool: BaseColorData[]
} {
  return {
    mathematical: generateTintsAndShades(baseColor, {
      ...options,
      style: 'mathematical',
    }),
    optical: generateTintsAndShades(baseColor, {
      ...options,
      style: 'optical',
    }),
    adaptive: generateTintsAndShades(baseColor, {
      ...options,
      style: 'adaptive',
    }),
    warmCool: generateTintsAndShades(baseColor, {
      ...options,
      style: 'warm-cool',
    }),
  }
}
