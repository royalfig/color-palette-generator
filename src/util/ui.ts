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
  neutral.oklch.c = Math.min(neutral.oklch.c * 0.12, 0.04) // Very low chroma for neutrals
  neutral.oklch.l = tone / 100
  return neutral
}

// Generate neutral variant colors (slightly more chromatic than neutrals)
function getNeutralVariantColor(color: Color, tone: number): Color {
  const neutralVariant = color.clone()
  neutralVariant.oklch.c = Math.min(neutralVariant.oklch.c * 0.24, 0.08) // Low chroma for neutral variants
  neutralVariant.oklch.l = tone / 100
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

  // Material 3 Color Roles
  return [
    // Primary colors
    colorFactory(getMaterialTone(primaryBase, 40, 80, isDarkMode), 'primary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryBase, 100, 20, isDarkMode), 'on-primary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryBase, 90, 30, isDarkMode), 'primary-subtle', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(primaryBase, 10, 90, isDarkMode), 'on-primary-subtle', 0, colorFormat, false, true),

    // Secondary colors
    colorFactory(getMaterialTone(secondaryBase, 40, 80, isDarkMode), 'secondary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(secondaryBase, 100, 20, isDarkMode), 'on-secondary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(secondaryBase, 90, 30, isDarkMode), 'secondary-subtle', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(secondaryBase, 10, 90, isDarkMode), 'on-secondary-subtle', 0, colorFormat, false, true),

    // Tertiary colors
    colorFactory(getMaterialTone(tertiaryBase, 40, 80, isDarkMode), 'tertiary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(tertiaryBase, 100, 20, isDarkMode), 'on-tertiary', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(tertiaryBase, 90, 30, isDarkMode), 'tertiary-subtle', 0, colorFormat, false, true),
    colorFactory(getMaterialTone(tertiaryBase, 10, 90, isDarkMode), 'on-tertiary-subtle', 0, colorFormat, false, true),

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

    // Surface container variants - improved dark and light mode differentiation
    colorFactory(
      getNeutralColor(primaryBase, isDarkMode ? 6 : 100),
      'surface-container-lowest',
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 12 : 94), 'surface-container-low', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 18 : 88), 'surface-container', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 24 : 82), 'surface-container-high', 0, colorFormat, false, true),
    colorFactory(
      getNeutralColor(primaryBase, isDarkMode ? 30 : 76),
      'surface-container-highest',
      0,
      colorFormat,
      false,
      true,
    ),

    // Outline colors
    colorFactory(getNeutralVariantColor(primaryBase, isDarkMode ? 60 : 50), 'outline', 0, colorFormat, false, true),
    colorFactory(getNeutralVariantColor(primaryBase, isDarkMode ? 30 : 80), 'outline-variant', 0, colorFormat, false, true),

    // Inverse colors
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 90 : 20), 'inverse-surface', 0, colorFormat, false, true),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 20 : 95), 'on-inverse-surface', 0, colorFormat, false, true),
  ]
}
