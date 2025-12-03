import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { PaletteKinds, ColorFormat } from '../types'

// ===== PRIMARY COLOR MODE DETECTION =====

/**
 * Determines if the primary color is naturally dark or light
 * Returns true if the color is dark (L < 0.5), false if light (L >= 0.5)
 */
function isPrimaryColorDark(primary: Color): boolean {
  return primary.oklch.l < 0.5
}

/**
 * Determines which mode should preserve the primary color as-is
 * Dark colors work best in dark mode, light colors work best in light mode
 */
function shouldPreserveInDarkMode(primary: Color): boolean {
  return isPrimaryColorDark(primary)
}

// ===== CONTRAST-BASED COLOR GENERATION =====

/**
 * Finds the optimal lightness value to achieve minimum contrast ratio
 * Uses binary search for efficiency
 * Determines search direction based on background lightness
 */
function findOptimalLightness(
  baseColor: Color,
  background: Color,
  minRatio: number,
  isDarkMode: boolean,
  preserveHue: boolean = true,
  preserveChroma: boolean = true,
): Color {
  // Determine if background is dark or light
  const backgroundL = background.oklch.l
  const isBackgroundDark = backgroundL < 0.5

  // If background is dark, we need light foreground (high L)
  // If background is light, we need dark foreground (low L)
  const needLightForeground = isBackgroundDark

  // Binary search for optimal lightness
  let minL = 0
  let maxL = 1
  let bestColor = baseColor.clone()

  // Try to find a lightness that meets contrast requirements
  for (let i = 0; i < 50; i++) {
    const testL = (minL + maxL) / 2
    const testColor = baseColor.clone()

    if (preserveHue && baseColor.oklch.h !== undefined) {
      testColor.oklch.h = baseColor.oklch.h
    }
    if (preserveChroma && baseColor.oklch.c !== undefined) {
      testColor.oklch.c = baseColor.oklch.c
    }
    testColor.oklch.l = testL

    const contrast = testColor.contrastWCAG21(background)

    if (contrast >= minRatio) {
      bestColor = testColor.clone()
      if (needLightForeground) {
        // We have enough contrast, can try going lighter for optimization
        minL = testL
      } else {
        // We have enough contrast, can try going darker for optimization
        maxL = testL
      }
    } else {
      if (needLightForeground) {
        // Need more contrast, current is too dark, search higher range
        minL = testL
      } else {
        // Need more contrast, current is too light, search lower range
        maxL = testL
      }
    }

    // If we're very close, break
    if (Math.abs(maxL - minL) < 0.001) break
  }

  return bestColor
}

/**
 * Adjusts a color to meet minimum contrast ratio with a background
 */
function adjustForContrast(color: Color, background: Color, minRatio: number, isDarkMode: boolean): Color {
  const currentContrast = color.contrastWCAG21(background)

  if (currentContrast >= minRatio) {
    return color.clone()
  }

  return findOptimalLightness(color, background, minRatio, isDarkMode)
}

/**
 * Ensures a color meets contrast requirements against a background
 * Adjusts lightness while preserving hue and chroma as much as possible
 */
function ensureContrast(color: Color, background: Color, minRatio: number, isDarkMode: boolean): Color {
  return adjustForContrast(color, background, minRatio, isDarkMode)
}

// ===== PRIMARY COLOR ADAPTATION =====

/**
 * Adapts the primary color for the specified mode
 * If the color naturally matches the mode, use it as-is
 * Otherwise, adjust it to work in the opposite mode
 */
function adaptPrimaryForMode(primary: Color, isDarkMode: boolean): Color {
  const isNaturallyDark = isPrimaryColorDark(primary)
  const shouldBeDark = isDarkMode

  // If natural mode matches requested mode, use as-is
  if (isNaturallyDark === shouldBeDark) {
    return primary.clone()
  }

  // Otherwise, adjust for opposite mode
  // For a dark color in light mode, we need to darken it further
  // For a light color in dark mode, we need to lighten it further
  const adjusted = primary.clone()

  if (isNaturallyDark && !shouldBeDark) {
    // Dark color in light mode - darken it
    adjusted.oklch.l = Math.max(0.15, adjusted.oklch.l * 0.7)
  } else {
    // Light color in dark mode - lighten it
    adjusted.oklch.l = Math.min(0.85, adjusted.oklch.l * 1.3)
  }

  return adjusted
}

// ===== ACCENT COLOR PREPARATION =====

/**
 * Prepares an accent color (secondary or tertiary) for UI use
 * Desaturates and adjusts for better UI integration
 */
function prepareAccentColor(baseColor: Color, role: 'secondary' | 'tertiary'): Color {
  const accent = baseColor.clone()

  if (role === 'secondary') {
    // Secondary should be moderately desaturated but still visible
    accent.oklch.c = Math.min(accent.oklch.c * 0.6, 0.12)
    // Ensure reasonable lightness for UI
    if (accent.oklch.l > 0.9) accent.oklch.l = 0.7
    if (accent.oklch.l < 0.1) accent.oklch.l = 0.3
  } else {
    // Tertiary should be more desaturated and subtle
    accent.oklch.c = Math.min(accent.oklch.c * 0.4, 0.08)
    // Lighter and softer for tertiary
    if (accent.oklch.l < 0.5) {
      accent.oklch.l = Math.min(accent.oklch.l + 0.15, 0.75)
    }
  }

  return accent
}

/**
 * Selects secondary and tertiary colors from the palette
 */
function selectAccentColors(
  paletteType: PaletteKinds,
  palette: BaseColorData[],
  primary: Color,
): { secondary: Color; tertiary: Color } {
  const safeGetColor = (index: number): Color => {
    if (palette[index]?.color) {
      return palette[index].color.clone()
    }
    // Generate fallback color with hue shift
    const fallback = primary.clone()
    fallback.oklch.h = (fallback.oklch.h + index * 60) % 360
    fallback.oklch.c = Math.min(fallback.oklch.c * 0.8, 0.12)
    return fallback
  }

  let secondaryIndex: number
  let tertiaryIndex: number

  switch (paletteType) {
    case 'com': // Complementary
      secondaryIndex = 1
      tertiaryIndex = 4
      break
    case 'spl': // Split-complementary
      secondaryIndex = 2
      tertiaryIndex = 4
      break
    case 'tri': // Triadic
      secondaryIndex = 2
      tertiaryIndex = 4
      break
    case 'tet': // Tetradic
      secondaryIndex = 1
      tertiaryIndex = 4
      break
    case 'ana': // Analogous
      secondaryIndex = 3
      tertiaryIndex = 1
      break
    case 'tas': // Tints and shades - monochrome
      const secondary = primary.clone()
      secondary.oklch.h = (secondary.oklch.h + 30) % 360
      secondary.oklch.c = Math.min(secondary.oklch.c * 0.6, 0.05)

      const tertiary = primary.clone()
      tertiary.oklch.h = (tertiary.oklch.h + 60) % 360
      tertiary.oklch.c = Math.min(tertiary.oklch.c * 0.4, 0.03)

      return {
        secondary: prepareAccentColor(secondary, 'secondary'),
        tertiary: prepareAccentColor(tertiary, 'tertiary'),
      }
    default:
      secondaryIndex = 1
      tertiaryIndex = 2
  }

  return {
    secondary: prepareAccentColor(safeGetColor(secondaryIndex), 'secondary'),
    tertiary: prepareAccentColor(safeGetColor(tertiaryIndex), 'tertiary'),
  }
}

// ===== SURFACE COLOR GENERATION =====

/**
 * Generates surface colors with proper contrast
 * Surface and on-surface must meet AAA contrast (7:1)
 * Surfaces are truly neutral (nearly white in light mode, dark gray in dark mode)
 *
 * Design principles:
 * - Light mode: Nearly white (L=0.992) with very subtle primary color tint (C=0.0015)
 * - Dark mode: Dark gray (L=0.18) with very subtle primary color tint for cohesion
 * - On-surface: Not pure white in dark mode (L ~0.9) to reduce eye strain
 * - Surfaces use primary's hue with minimal chroma for subtle warmth/coolness
 *
 * Surface Color Usage:
 * - surface: Main app background (page body, main container)
 * - on-surface: Primary text color on surface (headings, body text, high-emphasis content)
 * - on-surface-variant: Secondary text color (captions, hints, labels, medium-emphasis content)
 * - surface-elevated: Elevated surfaces like cards, dialogs, sheets, floating action areas
 * - surface-dim: Dimmed/depressed surfaces (disabled states, inactive tabs, pressed buttons)
 * - surface-bright: Brightened surfaces (hover states, active tabs, highlighted sections)
 */
function generateSurfaceColors(
  primary: Color,
  isDarkMode: boolean,
): {
  surface: Color
  onSurface: Color
  onSurfaceVariant: Color
  container: Color
  containerDim: Color
  containerBright: Color
} {
  // Create surface colors with subtle tint from primary color (very subdued)
  // Uses primary's hue with minimal chroma for warmth/coolness without being obvious
  // Light mode: nearly white with very subtle tint, Dark mode: dark gray with subtle tint

  // Surface color - main background
  // Usage: Main app background, page body, base container
  // Light mode: nearly white (L=0.99) with subtle primary color tint (C=0.003)
  // Dark mode: dark gray (L=0.12) with subtle primary color tint (C=0.005)
  const surface = primary.clone()
  surface.oklch.c = isDarkMode ? 0.005 : 0.003 // Reduced chroma for neutrality
  surface.oklch.l = isDarkMode ? 0.12 : 0.99 // Light mode approaching white

  // On-surface - text on surface (must meet AAA 7:1)
  // Usage: Primary text color for headings, body text, high-emphasis content
  // Light mode: nearly black (L=0.1), Dark mode: light gray (L=0.9, not pure white)
  const onSurface = primary.clone() // Use primary clone to keep hue
  onSurface.oklch.c = 0.01 // Slight chroma for harmony (was 0)
  onSurface.oklch.l = isDarkMode ? 0.95 : 0.1 // Increased lightness for dark mode contrast
  // Ensure AAA contrast
  const onSurfaceAdjusted = ensureContrast(onSurface, surface, 7.0, !isDarkMode)

  // On-surface-variant - slightly more chromatic than on-surface but still very neutral
  // Usage: Secondary text (captions, hints, labels, medium-emphasis content)
  // Has a subtle color tint to differentiate from primary text
  const onSurfaceVariant = primary.clone()
  onSurfaceVariant.oklch.c = 0.01 // Very minimal chroma, just a hint
  onSurfaceVariant.oklch.l = isDarkMode ? 0.75 : 0.3
  const onSurfaceVariantAdjusted = ensureContrast(onSurfaceVariant, surface, 4.5, !isDarkMode)

  // Surface elevation variants - all use primary hue with subtle tint
  // Light mode: subtle variations from base surface for clear hierarchy
  // Dark mode: subtle variations from base dark gray (creates depth)

  // Container variants (formerly surface variants)
  // Usage: Cards, dialogs, sheets, floating action areas, tooltips

  // Container: Elevated surfaces
  // Light mode: slightly darker than surface (L=0.95) to differentiate from pure white background
  // Dark mode: lighter than surface (L=0.18)
  const container = primary.clone()
  container.oklch.c = isDarkMode ? 0.008 : 0.004
  container.oklch.l = isDarkMode ? 0.18 : 0.95

  // Container-dim: Dimmed/depressed surfaces
  // Usage: Disabled states, inactive tabs, pressed buttons, scrim overlays
  // Light mode: darker than container (L=0.92)
  const containerDim = primary.clone()
  containerDim.oklch.c = isDarkMode ? 0.006 : 0.006
  containerDim.oklch.l = isDarkMode ? 0.08 : 0.92

  // Container-bright: Brightened surfaces
  // Usage: Hover states, active tabs, highlighted sections, selected items
  // Light mode: same as surface (L=0.99)
  const containerBright = primary.clone()
  containerBright.oklch.c = isDarkMode ? 0.01 : 0.003
  containerBright.oklch.l = isDarkMode ? 0.24 : 0.99 // Same as surface in light mode

  return {
    surface,
    onSurface: onSurfaceAdjusted,
    onSurfaceVariant: onSurfaceVariantAdjusted,
    container,
    containerDim,
    containerBright,
  }
}

// ===== OUTLINE AND INVERSE COLORS =====

/**
 * Generates outline and inverse colors
 */
function generateOutlineAndInverse(
  primary: Color,
  isDarkMode: boolean,
): {
  outline: Color
  outlineVariant: Color
  inverseSurface: Color
  onInverseSurface: Color
} {
  // Outline colors - slightly chromatic neutral variants
  const outlineBase = primary.clone()
  outlineBase.oklch.c = 0.01 // Reduced from 0.04 for better neutrality

  const outline = outlineBase.clone()
  outline.oklch.l = isDarkMode ? 0.7 : 0.4 // Increased contrast
  // Ensure visible contrast against surface
  const surface = primary.clone()
  surface.oklch.c = 0.008
  surface.oklch.l = isDarkMode ? 0.12 : 0.98
  const outlineAdjusted = ensureContrast(outline, surface, 3.0, !isDarkMode)

  const outlineVariant = outlineBase.clone()
  outlineVariant.oklch.l = isDarkMode ? 0.4 : 0.7 // Increased contrast spread

  // Inverse colors
  const inverseSurface = primary.clone()
  inverseSurface.oklch.c = 0.005
  inverseSurface.oklch.l = isDarkMode ? 0.9 : 0.2

  const onInverseSurface = primary.clone()
  onInverseSurface.oklch.c = 0.005
  onInverseSurface.oklch.l = isDarkMode ? 0.2 : 0.95
  const onInverseSurfaceAdjusted = ensureContrast(onInverseSurface, inverseSurface, 7.0, isDarkMode)

  return {
    outline: outlineAdjusted,
    outlineVariant,
    inverseSurface,
    onInverseSurface: onInverseSurfaceAdjusted,
  }
}

// ===== SEMANTIC COLOR GENERATION =====

/**
 * Finds a color in the palette by hue range, or generates a fallback
 */
function findPaletteColorByHue(palette: BaseColorData[], targetHue: number, tolerance: number = 20): Color | null {
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

/**
 * Gets average chroma from palette for harmony
 */
function getAverageChroma(palette: BaseColorData[]): number {
  const chromas = palette.filter(item => item?.color?.oklch?.c !== undefined).map(item => item.color.oklch.c)
  if (chromas.length === 0) return 0.1
  return chromas.reduce((sum, c) => sum + c, 0) / chromas.length
}

/**
 * Generates semantic colors (error, success, warning) with proper contrast
 */
function generateSemanticColors(
  primary: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
): {
  error: Color
  onError: Color
  success: Color
  onSuccess: Color
  warning: Color
  onWarning: Color
} {
  const avgChroma = getAverageChroma(palette)

  // Error color (red-ish)
  const errorBase =
    findPaletteColorByHue(palette, 30) ||
    (() => {
      const fallback = primary.clone()
      fallback.oklch.h = 30
      fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
      return fallback
    })()

  // Success color (green-ish)
  const successBase =
    findPaletteColorByHue(palette, 140) ||
    (() => {
      const fallback = primary.clone()
      fallback.oklch.h = 140
      fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
      return fallback
    })()

  // Warning color (yellow-ish)
  const warningBase =
    findPaletteColorByHue(palette, 80) ||
    (() => {
      const fallback = primary.clone()
      fallback.oklch.h = 80
      fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
      return fallback
    })()

  // Generate semantic colors with appropriate lightness
  const error = errorBase.clone()
  error.oklch.l = isDarkMode ? 0.8 : 0.4

  const onError = errorBase.clone()
  onError.oklch.l = isDarkMode ? 0.2 : 1.0
  const onErrorAdjusted = ensureContrast(onError, error, 4.5, !isDarkMode)

  const success = successBase.clone()
  success.oklch.l = isDarkMode ? 0.8 : 0.4

  const onSuccess = successBase.clone()
  onSuccess.oklch.l = isDarkMode ? 0.2 : 1.0
  const onSuccessAdjusted = ensureContrast(onSuccess, success, 4.5, !isDarkMode)

  const warning = warningBase.clone()
  warning.oklch.l = isDarkMode ? 0.7 : 0.5

  const onWarning = warningBase.clone()
  onWarning.oklch.l = isDarkMode ? 0.2 : 0.1
  const onWarningAdjusted = ensureContrast(onWarning, warning, 4.5, !isDarkMode)

  return {
    error,
    onError: onErrorAdjusted,
    success,
    onSuccess: onSuccessAdjusted,
    warning,
    onWarning: onWarningAdjusted,
  }
}

// ===== MAIN PALETTE GENERATION =====

export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
  colorFormat: ColorFormat,
): BaseColorData[] {
  // Step 1: Adapt primary color for the current mode
  const primary = adaptPrimaryForMode(color, isDarkMode)

  // Step 2: Generate primary colors with proper contrast
  // Primary container should have enough contrast with primary
  const primaryContainer = primary.clone()
  primaryContainer.oklch.l = isDarkMode ? 0.3 : 0.9

  // On-primary must contrast with primary (AA 4.5:1)
  const onPrimary = primary.clone()
  onPrimary.oklch.l = isDarkMode ? 0.2 : 1.0
  const onPrimaryAdjusted = ensureContrast(onPrimary, primary, 4.5, !isDarkMode)

  // On-primary-container must contrast with primary-container (AA 4.5:1)
  const onPrimaryContainer = primary.clone()
  onPrimaryContainer.oklch.l = isDarkMode ? 0.9 : 0.1
  const onPrimaryContainerAdjusted = ensureContrast(onPrimaryContainer, primaryContainer, 4.5, isDarkMode)

  // Step 3: Select and prepare accent colors
  const { secondary, tertiary } = selectAccentColors(paletteType, palette, primary)

  // Secondary colors
  const secondaryContainer = secondary.clone()
  secondaryContainer.oklch.l = isDarkMode ? 0.3 : 0.9

  const onSecondary = secondary.clone()
  onSecondary.oklch.l = isDarkMode ? 0.2 : 1.0
  const onSecondaryAdjusted = ensureContrast(onSecondary, secondary, 4.5, !isDarkMode)

  // Tertiary colors
  const tertiaryContainer = tertiary.clone()
  tertiaryContainer.oklch.l = isDarkMode ? 0.3 : 0.9

  const onTertiary = tertiary.clone()
  onTertiary.oklch.l = isDarkMode ? 0.2 : 1.0
  const onTertiaryAdjusted = ensureContrast(onTertiary, tertiary, 4.5, !isDarkMode)

  // Step 4: Generate surface colors (AAA contrast)
  const surfaces = generateSurfaceColors(primary, isDarkMode)

  // Step 5: Generate outline and inverse colors
  const outlineInverse = generateOutlineAndInverse(primary, isDarkMode)

  // Step 6: Generate semantic colors (AA contrast)
  const semantic = generateSemanticColors(primary, palette, isDarkMode)

  // Step 7: Return exactly 24 colors in consistent order
  return [
    // Primary colors (4)
    colorFactory(primary, 'primary', 0, colorFormat, false, true),
    colorFactory(onPrimaryAdjusted, 'on-primary', 0, colorFormat, false, true),
    colorFactory(primaryContainer, 'primary-container', 0, colorFormat, false, true),
    colorFactory(onPrimaryContainerAdjusted, 'on-primary-container', 0, colorFormat, false, true),

    // Secondary colors (2)
    colorFactory(secondary, 'secondary', 0, colorFormat, false, true),
    colorFactory(onSecondaryAdjusted, 'on-secondary', 0, colorFormat, false, true),

    // Tertiary colors (2)
    colorFactory(tertiary, 'tertiary', 0, colorFormat, false, true),
    colorFactory(onTertiaryAdjusted, 'on-tertiary', 0, colorFormat, false, true),

    // Surface colors (3)
    colorFactory(surfaces.surface, 'surface', 0, colorFormat, false, true),
    colorFactory(surfaces.onSurface, 'on-surface', 0, colorFormat, false, true),
    colorFactory(surfaces.onSurfaceVariant, 'on-surface-variant', 0, colorFormat, false, true),

    // Container variants (3)
    colorFactory(surfaces.container, 'container', 0, colorFormat, false, true),
    colorFactory(surfaces.containerDim, 'container-dim', 0, colorFormat, false, true),
    colorFactory(surfaces.containerBright, 'container-bright', 0, colorFormat, false, true),

    // Outline (2)
    colorFactory(outlineInverse.outline, 'outline', 0, colorFormat, false, true),
    colorFactory(outlineInverse.outlineVariant, 'outline-variant', 0, colorFormat, false, true),

    // Inverse (2)
    colorFactory(outlineInverse.inverseSurface, 'inverse-surface', 0, colorFormat, false, true),
    colorFactory(outlineInverse.onInverseSurface, 'on-inverse-surface', 0, colorFormat, false, true),

    // Semantic colors (6)
    colorFactory(semantic.error, 'error', 0, colorFormat, false, true),
    colorFactory(semantic.onError, 'on-error', 0, colorFormat, false, true),
    colorFactory(semantic.success, 'success', 0, colorFormat, false, true),
    colorFactory(semantic.onSuccess, 'on-success', 0, colorFormat, false, true),
    colorFactory(semantic.warning, 'warning', 0, colorFormat, false, true),
    colorFactory(semantic.onWarning, 'on-warning', 0, colorFormat, false, true),
  ]
}
