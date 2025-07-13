import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
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
  return [
    // Primary colors
    colorFactory(getMaterialTone(primaryBase, 40, 80, isDarkMode), 'primary', 0, 'oklch', false),
    colorFactory(getMaterialTone(primaryBase, 100, 20, isDarkMode), 'onPrimary', 0, 'oklch', false),
    colorFactory(getMaterialTone(primaryBase, 90, 30, isDarkMode), 'primaryContainer', 0, 'oklch', false),
    colorFactory(getMaterialTone(primaryBase, 10, 90, isDarkMode), 'onPrimaryContainer', 0, 'oklch', false),

    // Secondary colors
    colorFactory(getMaterialTone(secondaryBase, 40, 80, isDarkMode), 'secondary', 0, 'oklch', false),
    colorFactory(getMaterialTone(secondaryBase, 100, 20, isDarkMode), 'onSecondary', 0, 'oklch', false),
    colorFactory(getMaterialTone(secondaryBase, 90, 30, isDarkMode), 'secondaryContainer', 0, 'oklch', false),
    colorFactory(getMaterialTone(secondaryBase, 10, 90, isDarkMode), 'onSecondaryContainer', 0, 'oklch', false),

    // Tertiary colors
    colorFactory(getMaterialTone(tertiaryBase, 40, 80, isDarkMode), 'tertiary', 0, 'oklch', false),
    colorFactory(getMaterialTone(tertiaryBase, 100, 20, isDarkMode), 'onTertiary', 0, 'oklch', false),
    colorFactory(getMaterialTone(tertiaryBase, 90, 30, isDarkMode), 'tertiaryContainer', 0, 'oklch', false),
    colorFactory(getMaterialTone(tertiaryBase, 10, 90, isDarkMode), 'onTertiaryContainer', 0, 'oklch', false),

    // Surface colors
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 10 : 99), 'surface', 0, 'oklch', false),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 90 : 10), 'onSurface', 0, 'oklch', false),
    colorFactory(getNeutralVariantColor(primaryBase, isDarkMode ? 80 : 30), 'onSurfaceVariant', 0, 'oklch', false),

    // Surface container variants
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 4 : 100), 'surfaceContainerLowest', 0, 'oklch', false),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 10 : 96), 'surfaceContainerLow', 0, 'oklch', false),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 12 : 94), 'surfaceContainer', 0, 'oklch', false),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 17 : 92), 'surfaceContainerHigh', 0, 'oklch', false),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 22 : 90), 'surfaceContainerHighest', 0, 'oklch', false),

    // Outline colors
    colorFactory(getNeutralVariantColor(primaryBase, isDarkMode ? 60 : 50), 'outline', 0, 'oklch', false),
    // colorFactory(getNeutralVariantColor(primaryBase, isDarkMode ? 30 : 80), 'outlineVariant', 0, 'oklch', false),

    // Inverse colors
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 90 : 20), 'inverseSurface', 0, 'oklch', false),
    colorFactory(getNeutralColor(primaryBase, isDarkMode ? 20 : 95), 'onInverseSurface', 0, 'oklch', false),
    colorFactory(getMaterialTone(primaryBase, 80, 40, !isDarkMode), 'inversePrimary', 0, 'oklch', false), // Opposite of primary
  ]
}
