import Color from 'colorjs.io'
import { BaseColorData } from './factory'
import { PaletteKinds } from '../types'

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

export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
) {
  // For TAS (tints and shades), create a monochrome UI with minimal secondary/tertiary colors
  const isMonochrome = paletteType === 'tas'

  // Get base colors for primary, secondary, and tertiary
  let primaryBase = color
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
    // Use palette colors for secondary and tertiary, fallback to generated if not enough colors
    secondaryBase = palette[1]?.color || color.clone()
    tertiaryBase = palette[2]?.color || color.clone()
  }

  // Material 3 Color Roles
  return {
    // Primary colors
    primary: getMaterialTone(primaryBase, 40, 80, isDarkMode),
    onPrimary: getMaterialTone(primaryBase, 100, 20, isDarkMode),
    primaryContainer: getMaterialTone(primaryBase, 90, 30, isDarkMode),
    onPrimaryContainer: getMaterialTone(primaryBase, 10, 90, isDarkMode),

    // Secondary colors
    secondary: getMaterialTone(secondaryBase, 40, 80, isDarkMode),
    onSecondary: getMaterialTone(secondaryBase, 100, 20, isDarkMode),
    secondaryContainer: getMaterialTone(secondaryBase, 90, 30, isDarkMode),
    onSecondaryContainer: getMaterialTone(secondaryBase, 10, 90, isDarkMode),

    // Tertiary colors
    tertiary: getMaterialTone(tertiaryBase, 40, 80, isDarkMode),
    onTertiary: getMaterialTone(tertiaryBase, 100, 20, isDarkMode),
    tertiaryContainer: getMaterialTone(tertiaryBase, 90, 30, isDarkMode),
    onTertiaryContainer: getMaterialTone(tertiaryBase, 10, 90, isDarkMode),

    // Error colors (using a red base)
    error: getTone(new Color('oklch(0.548 0.196 27.33)'), isDarkMode ? 80 : 40),
    onError: getTone(new Color('oklch(0.548 0.196 27.33)'), isDarkMode ? 20 : 100),
    errorContainer: getTone(new Color('oklch(0.548 0.196 27.33)'), isDarkMode ? 30 : 90),
    onErrorContainer: getTone(new Color('oklch(0.548 0.196 27.33)'), isDarkMode ? 90 : 10),

    // Surface colors
    surface: getNeutralColor(primaryBase, isDarkMode ? 10 : 99),
    onSurface: getNeutralColor(primaryBase, isDarkMode ? 90 : 10),
    onSurfaceVariant: getNeutralVariantColor(primaryBase, isDarkMode ? 80 : 30),

    // Surface container variants
    surfaceContainerLowest: getNeutralColor(primaryBase, isDarkMode ? 4 : 100),
    surfaceContainerLow: getNeutralColor(primaryBase, isDarkMode ? 10 : 96),
    surfaceContainer: getNeutralColor(primaryBase, isDarkMode ? 12 : 94),
    surfaceContainerHigh: getNeutralColor(primaryBase, isDarkMode ? 17 : 92),
    surfaceContainerHighest: getNeutralColor(primaryBase, isDarkMode ? 22 : 90),

    // Outline colors
    outline: getNeutralVariantColor(primaryBase, isDarkMode ? 60 : 50),
    outlineVariant: getNeutralVariantColor(primaryBase, isDarkMode ? 30 : 80),

    // Inverse colors
    inverseSurface: getNeutralColor(primaryBase, isDarkMode ? 90 : 20),
    onInverseSurface: getNeutralColor(primaryBase, isDarkMode ? 20 : 95),
    inversePrimary: getMaterialTone(primaryBase, 80, 40, !isDarkMode), // Opposite of primary
  }
}
