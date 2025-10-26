import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { PaletteKinds, ColorFormat } from '../types'

// Helper to scale chroma based on lightness to prevent unwanted saturation in near-whites/blacks.
function getScaledChroma(chroma: number, lightness: number): number {
  // As lightness approaches 0 or 1, the scaling factor approaches 0.
  const lightnessDistance = Math.abs(lightness - 0.5)
  // A quadratic falloff ensures a smooth reduction.
  const chromaScale = Math.max(0, 1 - Math.pow(lightnessDistance * 1.8, 2))
  return chroma * chromaScale
}

// Creates a specific tone (lightness) for a color, with chroma scaling.
function getTone(color: Color, tone: number): Color {
  const result = color.clone()
  const targetLightness = tone / 100
  // Scale the chroma based on the target lightness.
  result.oklch.c = getScaledChroma(result.oklch.c, targetLightness)
  result.oklch.l = targetLightness
  return result
}

// Get the appropriate tone based on dark/light mode for Material 3
function getMaterialTone(color: Color, lightTone: number, darkTone: number, isDarkMode: boolean): Color {
  return getTone(color, isDarkMode ? darkTone : lightTone)
}

// AGGRESSIVE CAPPING: Generate neutral colors with a fixed, very low chroma target, scaled by lightness.
function getNeutralColor(baseColor: Color, tone: number): Color {
  const neutral = baseColor.clone()
  const targetLightness = tone / 100
  const targetChroma = 0.003 // Define the target chroma before scaling.
  neutral.oklch.c = getScaledChroma(targetChroma, targetLightness)
  neutral.oklch.l = targetLightness
  return neutral
}

// AGGRESSIVE CAPPING: Generate neutral variants with a fixed, low chroma target, scaled by lightness.
function getNeutralVariantColor(baseColor: Color, tone: number): Color {
  const neutralVariant = baseColor.clone()
  const targetLightness = tone / 100
  const targetChroma = 0.01 // Define the target chroma before scaling.
  neutralVariant.oklch.c = getScaledChroma(targetChroma, targetLightness)
  neutralVariant.oklch.l = targetLightness
  return neutralVariant
}

// Intelligently select secondary and tertiary colors based on palette type
function getOptimalSecondaryTertiary(paletteType: PaletteKinds, palette: BaseColorData[], fallbackColor: Color): { secondary: Color, tertiary: Color } {
  const safeGetColor = (index: number): Color => {
    if (palette[index]?.color) {
      return palette[index].color.clone()
    }
    const fallback = fallbackColor.clone()
    fallback.oklch.h = (fallback.oklch.h + (index * 60)) % 360
    fallback.oklch.c = Math.min(fallback.oklch.c * 0.8, 0.12)
    return fallback
  }

  switch (paletteType) {
    case 'com':
      return {
        secondary: enhanceForUI(safeGetColor(1), 'secondary'),
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary'),
      }
    case 'spl':
      return {
        secondary: enhanceForUI(safeGetColor(2), 'secondary'),
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary'),
      }
    case 'tri':
      return {
        secondary: enhanceForUI(safeGetColor(2), 'secondary'),
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary'),
      }
    case 'tet':
      return {
        secondary: enhanceForUI(safeGetColor(1), 'secondary'),
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary'),
      }
    case 'ana':
      return {
        secondary: enhanceForUI(safeGetColor(3), 'secondary'),
        tertiary: enhanceForUI(safeGetColor(1), 'tertiary'),
      }
    default:
      return {
        secondary: safeGetColor(1),
        tertiary: safeGetColor(2),
      }
  }
}

// GENERAL CAPPING: Tame colors for UI roles by capping their chroma.
function enhanceForUI(color: Color, role: 'secondary' | 'tertiary'): Color {
  const enhanced = color.clone()
  if (role === 'secondary') {
    enhanced.oklch.c = Math.min(enhanced.oklch.c, 0.08) // Moderate cap
    if (enhanced.oklch.l > 0.85) enhanced.oklch.l = 0.75
    if (enhanced.oklch.l < 0.25) enhanced.oklch.l = 0.35
  } else { // Tertiary
    enhanced.oklch.c = Math.min(enhanced.oklch.c, 0.04) // Low cap
  }
  return enhanced
}

export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
  colorFormat: ColorFormat,
) {
  // --- Tiered Chroma Capping with Lightness Scaling ---

  // 1. Primary role uses the original, uncapped color for full vibrancy.
  const primaryBase = color.clone()

  // 2. Primary containers get a general chroma cap.
  const primaryContainerBase = primaryBase.clone()
  primaryContainerBase.oklch.c = Math.min(primaryContainerBase.oklch.c, 0.05)

  // 3. Secondary and Tertiary colors are selected and capped via `enhanceForUI`.
  const { secondary: secondaryBase, tertiary: tertiaryBase } = getOptimalSecondaryTertiary(
    paletteType,
    palette,
    color,
  )

  // 4. The neutralBase provides the hue for the aggressively capped neutral functions.
  const neutralBase = primaryBase

  const findPaletteColorByHue = (targetHue: number, tolerance: number = 20): Color | null => {
    for (const item of palette) {
      if (item?.color?.oklch?.h !== undefined) {
        const hue = item.color.oklch.h
        const diff = Math.abs(hue - targetHue)
        const distance = Math.min(diff, 360 - diff)
        if (distance <= tolerance) {
          return item.color.clone()
        }
      }
    }
    return null
  }

  const avgChroma = 0.12
  const errorBase = findPaletteColorByHue(30) || (() => {
    const fallback = color.clone()
    fallback.oklch.h = 30
    fallback.oklch.c = avgChroma
    return fallback
  })()

  const successBase = findPaletteColorByHue(140) || (() => {
    const fallback = color.clone()
    fallback.oklch.h = 140
    fallback.oklch.c = avgChroma
    return fallback
  })()

  const warningBase = findPaletteColorByHue(80) || (() => {
    const fallback = color.clone()
    fallback.oklch.h = 80
    fallback.oklch.c = avgChroma
    return fallback
  })()

  // --- Material 3 Color Roles ---
  return [
    // Primary colors (Vibrant, but scaled at light/dark extremes)
    colorFactory(getMaterialTone(primaryBase, 40, 80, isDarkMode), 'primary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryBase, 100, 20, isDarkMode), 'on-primary', 0, colorFormat, false, true),
    // Primary containers (Capped and scaled)
    colorFactory(getMaterialTone(primaryContainerBase, 90, 30, isDarkMode), 'primary-container', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryContainerBase, 10, 90, isDarkMode), 'on-primary-container', 0, colorFormat, false, true),

    // Secondary colors (Capped and scaled)
    colorFactory(getMaterialTone(secondaryBase, 40, 80, isDarkMode), 'secondary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(secondaryBase, 100, 20, isDarkMode), 'on-secondary', 0, colorFormat, false, true),

    // Tertiary colors (Capped and scaled)
    colorFactory(getMaterialTone(tertiaryBase, 40, 80, isDarkMode), 'tertiary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(tertiaryBase, 100, 20, isDarkMode), 'on-tertiary', 0, colorFormat, false, true),

    // Surface colors (Aggressively Capped and scaled)
    colorFactory(getNeutralColor(neutralBase, isDarkMode ? 10 : 99), 'surface', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(neutralBase, isDarkMode ? 90 : 10), 'on-surface', 0, colorFormat, false, true),
    colorFactory(getNeutralVariantColor(neutralBase, isDarkMode ? 80 : 30), 'on-surface-variant', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(neutralBase, isDarkMode ? 18 : 92), 'surface-elevated', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(neutralBase, isDarkMode ? 14 : 94), 'surface-muted', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(neutralBase, isDarkMode ? 12 : 97), 'surface-subtle', 0, colorFormat, false, true),

    // Outline colors (Aggressively Capped and scaled)
    colorFactory(getNeutralVariantColor(neutralBase, isDarkMode ? 60 : 50), 'outline', 0, colorFormat, false, true),
    colorFactory(getNeutralVariantColor(neutralBase, isDarkMode ? 30 : 80), 'outline-variant', 0, colorFormat, false, true),

    // Inverse colors (Aggressively Capped and scaled)
    colorFactory(getNeutralColor(neutralBase, isDarkMode ? 90 : 20), 'inverse-surface', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(neutralBase, isDarkMode ? 20 : 95), 'on-inverse-surface', 0, colorFormat, false, true),

    // Error, Success, Warning colors (Capped and scaled)
    colorFactory(getMaterialTone(errorBase, 40, 80, isDarkMode), 'error', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(errorBase, 100, 20, isDarkMode), 'on-error', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(successBase, 40, 80, isDarkMode), 'success', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(successBase, 100, 20, isDarkMode), 'on-success', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(warningBase, 50, 70, isDarkMode), 'warning', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(warningBase, 10, 20, isDarkMode), 'on-warning', 0, colorFormat, false, true),
  ]
}