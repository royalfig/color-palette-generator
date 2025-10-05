import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { PaletteKinds, ColorFormat } from '../types'

// Material 3 tone mapping - creates specific lightness values for consistency
function getTone(color: Color, tone: number): Color {
  const result = color.clone()
  result.oklch.l = tone / 100
  return result
}

// Get the appropriate tone based on dark/light mode for Material 3
function getMaterialTone(color: Color, lightTone: number, darkTone: number, isDarkMode: boolean): Color {
  return getTone(color, isDarkMode ? darkTone : lightTone)
}

// Generate neutral colors from a base color by reducing chroma
function getNeutralColor(color: Color, tone: number): Color {
  const neutral = color.clone()
  // Fixed very low chroma for true neutrals - almost grayscale
  neutral.oklch.c = 0.005 // Extremely minimal tint, nearly imperceptible
  neutral.oklch.l = tone / 100 // Linear mapping is correct for OKLCH
  return neutral
}

// Generate neutral variant colors (slightly more chromatic than neutrals)
function getNeutralVariantColor(color: Color, tone: number): Color {
  const neutralVariant = color.clone()
  // Fixed low chroma - just enough to be noticeable but still neutral
  neutralVariant.oklch.c = 0.015 // Subtle hint of color
  neutralVariant.oklch.l = tone / 100 // Linear mapping is correct for OKLCH
  return neutralVariant
}

// Intelligently select secondary and tertiary colors based on palette type
function getOptimalSecondaryTertiary(paletteType: PaletteKinds, palette: BaseColorData[], fallbackColor: Color): { secondary: Color, tertiary: Color } {
  // Ensure we have enough colors, fallback to generated colors if needed
  const safeGetColor = (index: number): Color => {
    if (palette[index]?.color) {
      return palette[index].color.clone()
    }
    // Generate fallback color with hue shift
    const fallback = fallbackColor.clone()
    fallback.oklch.h = (fallback.oklch.h + (index * 60)) % 360
    // Reduce chroma slightly for harmony
    fallback.oklch.c = Math.min(fallback.oklch.c * 0.8, 0.12)
    return fallback
  }

  switch (paletteType) {
    case 'com': // Complementary - high contrast, great for UI
      return {
        secondary: safeGetColor(1), // Main complement - maximum contrast
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary') // Light complement
      }
    
    case 'spl': // Split-complementary - most versatile for UI
      return {
        secondary: enhanceForUI(safeGetColor(2), 'secondary'), // First split - balanced contrast
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary') // Second split - alternative accent
      }
    
    case 'tri': // Triadic - energetic, good for creative UIs
      return {
        secondary: enhanceForUI(safeGetColor(2), 'secondary'), // First triad pure
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary') // Second triad pure
      }
    
    case 'tet': // Tetradic - complex but balanced
      return {
        secondary: enhanceForUI(safeGetColor(1), 'secondary'), // First tetradic - balanced contrast
        tertiary: enhanceForUI(safeGetColor(4), 'tertiary') // Fourth tetradic light
      }
    
    case 'ana': // Analogous - harmonious, good for content-focused UIs
      return {
        secondary: enhanceForUI(safeGetColor(3), 'secondary'), // Subtle contrast, maintains harmony
        tertiary: enhanceForUI(safeGetColor(1), 'tertiary') // Muted nearby hue
      }
    
    default:
      // Fallback to original simple logic
      return {
        secondary: safeGetColor(1),
        tertiary: safeGetColor(2)
      }
  }
}

// Enhance colors specifically for UI roles
function enhanceForUI(color: Color, role: 'secondary' | 'tertiary'): Color {
  const enhanced = color.clone()
  
  if (role === 'secondary') {
    // Secondary should be vibrant and accessible
    // Ensure adequate chroma for visual interest
    enhanced.oklch.c = Math.max(enhanced.oklch.c, 0.08)
    // Optimize lightness for accessibility (not too light, not too dark)
    if (enhanced.oklch.l > 0.85) enhanced.oklch.l = 0.75
    if (enhanced.oklch.l < 0.25) enhanced.oklch.l = 0.35
  } else {
    // Tertiary should be softer, more subtle
    // Reduce chroma for subtlety
    enhanced.oklch.c = Math.min(enhanced.oklch.c * 0.7, 0.1)
    // Adjust lightness to be lighter and more approachable
    if (enhanced.oklch.l < 0.5) {
      enhanced.oklch.l = Math.min(enhanced.oklch.l + 0.2, 0.7)
    }
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
  // For TAS (tints and shades), create a monochrome UI with minimal secondary/tertiary colors
  const isMonochrome = paletteType === 'tas'

  // Get base colors for primary, secondary, and tertiary
  // Use the original user color as the primary base, not from palette
  let primaryBase = color.clone()
  let secondaryBase: Color
  let tertiaryBase: Color

  if (isMonochrome) {
    // For monochrome, use the primary color as base but shift hue slightly for variety
    secondaryBase = color.clone()
    secondaryBase.oklch.h = (secondaryBase.oklch.h + 30) % 360
    secondaryBase.oklch.c = Math.min(secondaryBase.oklch.c * 0.6, 0.05) // Very low chroma

    tertiaryBase = color.clone()
    tertiaryBase.oklch.h = (tertiaryBase.oklch.h + 60) % 360
    tertiaryBase.oklch.c = Math.min(tertiaryBase.oklch.c * 0.4, 0.03) // Even lower chroma
  } else {
    // Intelligently select secondary and tertiary colors based on palette type
    const { secondary, tertiary } = getOptimalSecondaryTertiary(paletteType, palette, color)
    secondaryBase = secondary
    tertiaryBase = tertiary
  }

  // Helper to find color in palette by hue range
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

  // Helper to calculate average chroma from palette for harmony
  const getAverageChroma = (): number => {
    const chromas = palette
      .filter(item => item?.color?.oklch?.c !== undefined)
      .map(item => item.color.oklch.c)
    if (chromas.length === 0) return 0.1 // Default moderate chroma
    return chromas.reduce((sum, c) => sum + c, 0) / chromas.length
  }

  const avgChroma = getAverageChroma()

  // Create semantic colors: prefer palette colors, fallback to adaptive generation
  const errorBase = findPaletteColorByHue(30) || (() => {
    const fallback = color.clone()
    fallback.oklch.h = 30
    // Adapt chroma to palette's average, but ensure visibility for error states
    fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
    return fallback
  })()

  const successBase = findPaletteColorByHue(140) || (() => {
    const fallback = color.clone()
    fallback.oklch.h = 140
    // Adapt chroma to palette's average
    fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
    return fallback
  })()

  const warningBase = findPaletteColorByHue(80) || (() => {
    const fallback = color.clone()
    fallback.oklch.h = 80
    // Adapt chroma to palette's average
    fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
    return fallback
  })()

  // Material 3 Color Roles
  return [
    // Primary colors
    colorFactory(getMaterialTone(primaryBase, 40, 80, isDarkMode), 'primary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryBase, 100, 20, isDarkMode), 'on-primary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryBase, 90, 30, isDarkMode), 'primary-container', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryBase, 10, 90, isDarkMode), 'on-primary-container', 0, colorFormat, false, true),

    // Secondary colors
    colorFactory(getMaterialTone(secondaryBase, 40, 80, isDarkMode), 'secondary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(secondaryBase, 100, 20, isDarkMode), 'on-secondary', 0, colorFormat, false, true),

    // Tertiary colors
    colorFactory(getMaterialTone(tertiaryBase, 40, 80, isDarkMode), 'tertiary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(tertiaryBase, 100, 20, isDarkMode), 'on-tertiary', 0, colorFormat, false, true),

    // Surface colors
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 10 : 99), 'surface', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 90 : 10), 'on-surface', 0, colorFormat, false, true),
    colorFactory(
      getNeutralVariantColor(primaryBase, isDarkMode ? 80 : 30),
      'on-surface-variant',
      0,
      colorFormat,
      false,
      true,
    ),

    // Surface variants - simplified to 3 semantic levels
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 18 : 92), 'surface-elevated', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 14 : 94), 'surface-muted', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 12 : 97), 'surface-subtle', 0, colorFormat, false, true),

    // Outline colors
    colorFactory(getNeutralVariantColor(primaryBase, isDarkMode ? 60 : 50), 'outline', 0, colorFormat, false, true),
    colorFactory(getNeutralVariantColor(primaryBase, isDarkMode ? 30 : 80), 'outline-variant', 0, colorFormat, false, true),

    // Inverse colors
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 90 : 20), 'inverse-surface', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 20 : 95), 'on-inverse-surface', 0, colorFormat, false, true),

    // Error colors
    colorFactory(getMaterialTone(errorBase, 40, 80, isDarkMode), 'error', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(errorBase, 100, 20, isDarkMode), 'on-error', 0, colorFormat, false, true),

    // Success colors
    colorFactory(getMaterialTone(successBase, 40, 80, isDarkMode), 'success', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(successBase, 100, 20, isDarkMode), 'on-success', 0, colorFormat, false, true),

    // Warning colors
    colorFactory(getMaterialTone(warningBase, 50, 70, isDarkMode), 'warning', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(warningBase, 10, 20, isDarkMode), 'on-warning', 0, colorFormat, false, true),
  ]
}
