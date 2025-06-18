import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat } from '../types'
import { ColorSpace } from '../types'

export function generateTintsAndShades(
  baseColor: string,
  options: {
    style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { style } = options
  const format = options.colorSpace.format

  try {
    const baseColorObj = new Color(baseColor)

    // For tints and shades, we'll create 12 colors:
    // 5 shades (darker) + base + 6 tints (lighter)
    const colors: BaseColorData[] = []

    // Define lightness progression
    let lightnessSteps: number[]

    switch (style) {
      case 'mathematical':
        lightnessSteps = getMathematicalTintsShades(baseColorObj.oklch.l)
        break
      case 'optical':
        lightnessSteps = getVisuallyPleasingTintsShades(baseColorObj.oklch.l)
        break
      case 'adaptive':
        lightnessSteps = getAdaptiveTintsShades(baseColorObj)
        break
      case 'warm-cool':
        lightnessSteps = getWarmCoolTintsShades(baseColorObj)
        break
    }

    lightnessSteps.forEach((lightness, index) => {
      if (index === 5) {
        // Base color (unchanged) - position 6 of 12
        colors.push(colorFactory(baseColor, 'tints-shades', index, format, true))
        return
      }

      // Apply style-specific adjustments
      let adjustedChroma = baseColorObj.oklch.c
      let adjustedHue = baseColorObj.oklch.h || 0

      // Apply chroma and hue adjustments based on style
      if (style === 'optical' || style === 'adaptive' || style === 'warm-cool') {
        const chromaHueAdjustments = getChromaHueAdjustments(
          lightness,
          baseColorObj.oklch.l,
          baseColorObj.oklch.c,
          baseColorObj.oklch.h || 0,
          style,
        )
        adjustedChroma = chromaHueAdjustments.chroma
        adjustedHue = chromaHueAdjustments.hue
      }

      const values = clampOKLCH(lightness, adjustedChroma, adjustedHue)

      const color = baseColorObj.clone()
      color.oklch.l = values.l
      color.oklch.c = values.c
      color.oklch.h = values.h

      colors.push(colorFactory(color, 'tints-shades', index, format))
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate tints and shades for ${baseColor}: ${e}`)
  }
}

function getMathematicalTintsShades(baseLightness: number): number[] {
  // Pure mathematical progression - linear steps
  return [
    0.05, // Darkest shade
    0.15,
    0.25,
    0.35,
    0.45, // Lightest shade
    baseLightness, // Base (position 6)
    0.55, // Darkest tint
    0.65,
    0.75,
    0.85,
    0.92,
    0.97, // Lightest tint
  ]
}

function getVisuallyPleasingTintsShades(baseLightness: number): number[] {
  // Non-linear progression that looks more natural
  const range = baseLightness
  const tintRange = 0.98 - baseLightness

  return [
    Math.max(0.02, baseLightness - range * 0.9), // Very dark shade
    Math.max(0.05, baseLightness - range * 0.7), // Dark shade
    Math.max(0.08, baseLightness - range * 0.5), // Medium shade
    Math.max(0.12, baseLightness - range * 0.3), // Light shade
    Math.max(0.15, baseLightness - range * 0.15), // Subtle shade
    baseLightness, // Base
    Math.min(0.98, baseLightness + tintRange * 0.15), // Subtle tint
    Math.min(0.95, baseLightness + tintRange * 0.3), // Light tint
    Math.min(0.92, baseLightness + tintRange * 0.5), // Medium tint
    Math.min(0.88, baseLightness + tintRange * 0.7), // Strong tint
    Math.min(0.95, baseLightness + tintRange * 0.85), // Very light tint
    Math.min(0.98, baseLightness + tintRange * 0.95), // Lightest tint
  ]
}

function getAdaptiveTintsShades(baseColor: Color): number[] {
  const oklch = baseColor.to('oklch')
  const baseLightness = oklch.l

  // Adapt progression based on base lightness
  if (baseLightness > 0.8) {
    // Light base: more shades, fewer tints
    return [
      0.05,
      0.15,
      0.25,
      0.4,
      0.6,
      baseLightness,
      Math.min(0.98, baseLightness + 0.05),
      Math.min(0.98, baseLightness + 0.08),
      Math.min(0.98, baseLightness + 0.12),
      Math.min(0.98, baseLightness + 0.15),
      Math.min(0.98, baseLightness + 0.17),
      0.98,
    ]
  } else if (baseLightness < 0.3) {
    // Dark base: fewer shades, more tints
    return [
      0.02,
      Math.max(0.02, baseLightness - 0.05),
      Math.max(0.02, baseLightness - 0.08),
      Math.max(0.02, baseLightness - 0.12),
      Math.max(0.02, baseLightness - 0.15),
      baseLightness,
      0.4,
      0.55,
      0.7,
      0.82,
      0.92,
      0.98,
    ]
  } else {
    // Medium lightness: balanced progression
    return getVisuallyPleasingTintsShades(baseLightness)
  }
}

function getWarmCoolTintsShades(baseColor: Color): number[] {
  // Same as visually pleasing but will adjust chroma/hue
  return getVisuallyPleasingTintsShades(baseColor.oklch.l)
}

function getChromaHueAdjustments(
  targetLightness: number,
  baseLightness: number,
  baseChroma: number,
  baseHue: number,
  style: string,
): { chroma: number; hue: number } {
  const lightnessDiff = targetLightness - baseLightness

  if (style === 'optical' || style === 'adaptive') {
    // Natural color behavior: darker colors can be more saturated
    // Lighter colors become less saturated
    let chromaMultiplier = 1.0

    if (lightnessDiff < 0) {
      // Getting darker: can increase saturation slightly
      chromaMultiplier = 1.0 + Math.abs(lightnessDiff) * 0.3
    } else {
      // Getting lighter: reduce saturation
      chromaMultiplier = 1.0 - lightnessDiff * 0.5
    }

    return {
      chroma: Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier)),
      hue: baseHue,
    }
  }

  if (style === 'warm-cool') {
    // Shadows go cooler, highlights go warmer
    let hueShift = 0
    let chromaMultiplier = 1.0

    if (lightnessDiff < 0) {
      // Darker: shift cooler and increase saturation
      hueShift = lightnessDiff * -10 // Cooler (toward blue)
      chromaMultiplier = 1.0 + Math.abs(lightnessDiff) * 0.2
    } else {
      // Lighter: shift warmer and decrease saturation
      hueShift = lightnessDiff * 15 // Warmer (toward yellow)
      chromaMultiplier = 1.0 - lightnessDiff * 0.4
    }

    return {
      chroma: Math.max(0, Math.min(0.37, baseChroma * chromaMultiplier)),
      hue: (baseHue + hueShift + 360) % 360,
    }
  }

  // Mathematical: no adjustments
  return { chroma: baseChroma, hue: baseHue }
}
