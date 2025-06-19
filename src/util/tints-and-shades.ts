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
    let lightnessProgression: number[]

    switch (style) {
      case 'mathematical':
        lightnessProgression = getMathematicalProgression(baseLightness)
        break
      case 'optical':
        lightnessProgression = getOpticalProgression(baseColorObj)
        break
      case 'adaptive':
        lightnessProgression = getAdaptiveProgression(baseColorObj)
        break
      case 'warm-cool':
        lightnessProgression = getLuminosityProgression(baseColorObj)
        break
    }

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
        baseColorObj,
      )

      // Apply muddy zone avoidance if enhanced mode
      let finalChroma = adjustments.chroma
      let finalHue = adjustments.hue
      let finalLightness = targetLightness

      if (enhanced) {
        const cleaned = avoidMuddyZones(finalHue, finalLightness, finalChroma)
        finalHue = cleaned.h
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

function getMathematicalProgression(baseLightness: number): number[] {
  // Pure mathematical - evenly distributed 12 steps from 0.05 to 0.95
  return Array.from({ length: 12 }, (_, i) => 0.05 + (i * 0.9) / 11)
}

function getOpticalProgression(baseColor: Color): number[] {
  // Perceptual Harmony: Based on how human vision perceives lightness differences
  const baseLightness = baseColor.oklch.l

  // Human vision is more sensitive to changes in darker values
  // Use a curved progression that mirrors visual perception
  const steps = 12
  const progression: number[] = []

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1) // 0 to 1

    // Use a power curve that compresses darker values (more steps in shadows)
    // and expands lighter values (fewer steps in highlights)
    const curve = Math.pow(t, 1.8) // Curve favoring shadow detail

    // Map to lightness range with better shadow separation
    const lightness = 0.02 + curve * 0.96
    progression.push(lightness)
  }

  return progression
}

function getAdaptiveProgression(baseColor: Color): number[] {
  // Emotional Resonance: Creates progressions that enhance emotional storytelling
  const oklch = baseColor.to('oklch')
  const baseLightness = oklch.l
  const hue = oklch.h
  const chroma = oklch.c

  // Determine emotional profile and create meaningful progression
  if (hue >= 345 || hue < 30) {
    // Passionate reds: dramatic progression from deep shadows to brilliant highlights
    return [
      0.02, // Deep shadow (mystery)
      0.08, // Shadow (depth)
      0.15, // Dark (intensity building)
      0.25, // Medium dark (smoldering)
      0.35, // Approaching base
      0.45, // Pre-base
      0.55, // Post-base
      0.65, // Warming up
      0.75, // Glowing
      0.83, // Radiant
      0.9, // Brilliant
      0.96, // Pure light (transcendent)
    ]
  }

  if (hue >= 30 && hue < 90) {
    // Energetic oranges/yellows: sunrise progression
    return [
      0.05, // Pre-dawn
      0.12, // Dawn breaking
      0.2, // Early light
      0.3, // Morning glow
      0.42, // Brightening
      0.55, // Full morning
      0.68, // Midday approach
      0.78, // Bright day
      0.86, // High noon
      0.92, // Brilliant day
      0.96, // Solar peak
      0.98, // Pure radiance
    ]
  }

  if (hue >= 150 && hue < 210) {
    // Tranquil blues: ocean depth progression
    return [
      0.03, // Abyss
      0.1, // Deep ocean
      0.18, // Ocean depth
      0.28, // Mid-depth
      0.4, // Approaching surface
      0.52, // Shallow water
      0.64, // Clear water
      0.74, // Sunlit water
      0.82, // Bright reflection
      0.88, // Sparkling surface
      0.93, // Brilliant reflection
      0.97, // Pure light
    ]
  }

  // Default: balanced emotional progression
  return [0.04, 0.11, 0.19, 0.29, 0.4, 0.51, 0.62, 0.72, 0.8, 0.87, 0.93, 0.97]
}

function getLuminosityProgression(baseColor: Color): number[] {
  // Luminosity Dance: Based on how light behaves in real-world scenarios
  const oklch = baseColor.to('oklch')
  const baseLightness = oklch.l
  const hue = oklch.h
  const chroma = oklch.c

  // Determine lighting scenario
  if (baseLightness > 0.8 && chroma < 0.3) {
    // Bright daylight scenario: gentle transitions, more shadow detail
    return [
      0.02, // Deep shadow
      0.08, // Shadow transition
      0.16, // Mid shadow
      0.26, // Light shadow
      0.38, // Indirect light
      0.5, // Soft light
      0.62, // Direct light
      0.74, // Bright light
      0.84, // Strong light
      0.91, // Brilliant light
      0.96, // Peak light
      0.98, // Pure white light
    ]
  }

  if (hue >= 30 && hue < 90 && baseLightness > 0.6) {
    // Golden hour scenario: dramatic shadow-to-light transition
    return [
      0.03, // Deep shadow
      0.09, // Shadow
      0.17, // Transition shadow
      0.28, // Lit shadow
      0.42, // Indirect golden light
      0.58, // Golden light
      0.72, // Bright golden light
      0.83, // Brilliant golden
      0.9, // Sun-kissed
      0.95, // Solar highlight
      0.97, // Pure golden light
      0.99, // Solar peak
    ]
  }

  if (hue >= 180 && hue < 240 && baseLightness < 0.5) {
    // Cool/moonlight scenario: compressed range, more subtle
    return [
      0.02, // Deep night
      0.06, // Night shadow
      0.12, // Dark
      0.2, // Dim
      0.3, // Low light
      0.42, // Moonlight
      0.55, // Bright moonlight
      0.68, // Artificial light
      0.78, // Mixed lighting
      0.86, // Bright artificial
      0.92, // Strong light
      0.96, // Brilliant artificial
    ]
  }

  if (chroma > 0.8 && baseLightness < 0.4) {
    // Dramatic lighting: extreme contrast
    return [
      0.01, // Black shadow
      0.05, // Deep dramatic shadow
      0.12, // Stage shadow
      0.22, // Dramatic mid-tone
      0.35, // Approaching light
      0.5, // Stage light
      0.66, // Bright stage light
      0.78, // Strong spotlight
      0.87, // Brilliant spotlight
      0.93, // Peak drama
      0.97, // Pure stage light
      0.99, // Theatrical peak
    ]
  }

  // Natural light scenario: realistic progression
  return [0.03, 0.09, 0.17, 0.27, 0.39, 0.52, 0.65, 0.76, 0.85, 0.91, 0.96, 0.98]
}

function findBaseColorPosition(baseLightness: number, progression: number[]): number {
  // Find the position where the base color should be inserted
  let closestIndex = 0
  let closestDifference = Math.abs(progression[0] - baseLightness)

  for (let i = 1; i < progression.length; i++) {
    const difference = Math.abs(progression[i] - baseLightness)
    if (difference < closestDifference) {
      closestDifference = difference
      closestIndex = i
    }
  }

  // Replace the closest position with the exact base lightness
  progression[closestIndex] = baseLightness

  return closestIndex
}

function getStyleAdjustments(
  targetLightness: number,
  baseLightness: number,
  baseChroma: number,
  baseHue: number,
  style: string,
  baseColor: Color,
): { chroma: number; hue: number } {
  const lightnessDiff = targetLightness - baseLightness

  if (style === 'mathematical') {
    // Mathematical: no adjustments, pure lightness changes
    return { chroma: baseChroma, hue: baseHue }
  }

  if (style === 'optical') {
    // Perceptual Harmony: natural color behavior
    // Darker colors can hold more saturation, lighter colors become more muted
    let chromaMultiplier = 1.0

    if (lightnessDiff < 0) {
      // Getting darker: can increase saturation (shadows are richer)
      chromaMultiplier = 1.0 + Math.abs(lightnessDiff) * 0.4
    } else {
      // Getting lighter: reduce saturation (atmospheric perspective)
      chromaMultiplier = 1.0 - lightnessDiff * 0.6
    }

    return {
      chroma: Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier)),
      hue: baseHue,
    }
  }

  if (style === 'adaptive') {
    // Emotional Resonance: varies by emotional type
    const hue = baseColor.oklch.h
    let chromaMultiplier = 1.0
    let hueShift = 0

    if (hue >= 345 || hue < 30) {
      // passionate
      if (lightnessDiff < 0) {
        // Darker: more intense, slightly cooler (mysterious passion)
        chromaMultiplier = 1.0 + Math.abs(lightnessDiff) * 0.5
        hueShift = lightnessDiff * -5 // Slight cool shift
      } else {
        // Lighter: warm, radiant glow
        chromaMultiplier = 1.0 - lightnessDiff * 0.4
        hueShift = lightnessDiff * 8 // Warm shift
      }
    } else if (hue >= 150 && hue < 210) {
      // tranquil
      if (lightnessDiff < 0) {
        // Darker: deeper, more mysterious
        chromaMultiplier = 1.0 + Math.abs(lightnessDiff) * 0.3
        hueShift = lightnessDiff * -3
      } else {
        // Lighter: ethereal, peaceful
        chromaMultiplier = 1.0 - lightnessDiff * 0.5
        hueShift = lightnessDiff * 5
      }
    } else {
      // Default emotional progression
      chromaMultiplier = lightnessDiff < 0 ? 1.0 + Math.abs(lightnessDiff) * 0.3 : 1.0 - lightnessDiff * 0.5
    }

    return {
      chroma: Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier)),
      hue: (baseHue + hueShift + 360) % 360,
    }
  }

  if (style === 'warm-cool') {
    // Luminosity Dance: temperature shifts based on lighting physics
    let hueShift = 0
    let chromaMultiplier = 1.0

    if (lightnessDiff < 0) {
      // Darker: shadows go cooler and can be more saturated
      hueShift = lightnessDiff * -12 // Cooler (toward blue)
      chromaMultiplier = 1.0 + Math.abs(lightnessDiff) * 0.3
    } else {
      // Lighter: highlights go warmer and become less saturated
      hueShift = lightnessDiff * 18 // Warmer (toward yellow)
      chromaMultiplier = 1.0 - lightnessDiff * 0.5
    }

    return {
      chroma: Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier)),
      hue: (baseHue + hueShift + 360) % 360,
    }
  }

  return { chroma: baseChroma, hue: baseHue }
}
