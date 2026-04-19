import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { PaletteKinds, ColorFormat } from './types'

// ===== PRIMARY COLOR MODE DETECTION =====

function isPrimaryColorDark(primary: Color): boolean {
  return primary.oklch.l < 0.5
}

// ===== CONTRAST-BASED COLOR GENERATION =====

/**
 * Binary search for the lightness value that minimally satisfies the contrast ratio.
 * Dark background → finds minimum L that still meets ratio.
 * Light background → finds maximum L that still meets ratio.
 */
function findOptimalLightness(
  baseColor: Color,
  background: Color,
  minRatio: number,
  preserveHue: boolean = true,
  preserveChroma: boolean = true,
): Color {
  const backgroundL = background.oklch.l
  const needLightForeground = backgroundL < 0.5

  let minL = 0
  let maxL = 1
  let bestColor = baseColor.clone()

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
        maxL = testL // found a working L; try darker to find minimum
      } else {
        minL = testL // found a working L; try lighter to find maximum
      }
    } else {
      if (needLightForeground) {
        minL = testL // too dark; need to go lighter
      } else {
        maxL = testL // too light; need to go darker
      }
    }

    if (Math.abs(maxL - minL) < 0.001) break
  }

  return bestColor
}

function ensureContrast(color: Color, background: Color, minRatio: number): Color {
  if (color.contrastWCAG21(background) >= minRatio) {
    return color.clone()
  }
  return findOptimalLightness(color, background, minRatio)
}

// ===== PRIMARY COLOR ADAPTATION =====

/**
 * Preserves the primary color unchanged in the mode where it naturally has best contrast,
 * and adapts it for the other mode.
 *
 * Dark primary (L < 0.5) → best contrast on light surface → preserved in light mode.
 * Light primary (L ≥ 0.5) → best contrast on dark surface → preserved in dark mode.
 */
function adaptPrimaryForMode(primary: Color, isDarkMode: boolean): Color {
  const isNaturallyDark = isPrimaryColorDark(primary)

  // Preserve as-is in the mode where the primary already contrasts well
  if (isNaturallyDark && !isDarkMode) return primary.clone()
  if (!isNaturallyDark && isDarkMode) return primary.clone()

  // Same polarity as surface (dark-on-dark or light-on-light) — needs significant shift
  const adjusted = primary.clone()
  if (isNaturallyDark) {
    adjusted.oklch.l = Math.min(0.78, adjusted.oklch.l + 0.42)
  } else {
    adjusted.oklch.l = Math.max(0.22, adjusted.oklch.l - 0.42)
  }
  return adjusted
}

// ===== ACCENT COLOR PREPARATION =====

/**
 * Prepares an accent color (secondary or tertiary) for UI use.
 * Desaturates for better UI integration while retaining some vibrancy from the source.
 */
function prepareAccentColor(baseColor: Color, role: 'secondary' | 'tertiary'): Color {
  const accent = baseColor.clone()

  if (role === 'secondary') {
    accent.oklch.c = Math.max(Math.min(accent.oklch.c * 0.6, 0.18), 0.05)
    if (accent.oklch.l > 0.9) accent.oklch.l = 0.7
    if (accent.oklch.l < 0.1) accent.oklch.l = 0.3
  } else {
    accent.oklch.c = Math.max(Math.min(accent.oklch.c * 0.4, 0.12), 0.03)
    if (accent.oklch.l < 0.5) {
      accent.oklch.l = Math.min(accent.oklch.l + 0.15, 0.75)
    }
  }

  return accent
}

/**
 * Selects secondary and tertiary colors from the palette.
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
    const fallback = primary.clone()
    fallback.oklch.h = (fallback.oklch.h + index * 60) % 360
    fallback.oklch.c = Math.min(fallback.oklch.c * 0.8, 0.12)
    return fallback
  }

  let secondaryIndex: number
  let tertiaryIndex: number

  switch (paletteType) {
    case 'com':
      secondaryIndex = 1
      tertiaryIndex = 4
      break
    case 'spl':
      secondaryIndex = 2
      tertiaryIndex = 4
      break
    case 'tri':
      secondaryIndex = 2
      tertiaryIndex = 4
      break
    case 'tet':
      secondaryIndex = 1
      tertiaryIndex = 4
      break
    case 'ana':
      secondaryIndex = 3
      tertiaryIndex = 1
      break
    case 'ton': // Tonal - monochromatic with lightness variations; use hue-shifted fallbacks
      const tonSecondary = primary.clone()
      tonSecondary.oklch.h = (tonSecondary.oklch.h + 30) % 360
      tonSecondary.oklch.c = Math.min(tonSecondary.oklch.c * 0.6, 0.05)

      const tonTertiary = primary.clone()
      tonTertiary.oklch.h = (tonTertiary.oklch.h + 60) % 360
      tonTertiary.oklch.c = Math.min(tonTertiary.oklch.c * 0.4, 0.03)

      return {
        secondary: prepareAccentColor(tonSecondary, 'secondary'),
        tertiary: prepareAccentColor(tonTertiary, 'tertiary'),
      }
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
 * Surface slots (4 semantic roles):
 * - surface:            Page/app canvas — <body>, page wrapper, sidebar shell
 * - container:          Inline elevated content — cards, dialogs, sheets (Carbon-level ΔL)
 * - container-sunken:   Recessed wells — text inputs, code blocks, data table rows
 * - container-overlay:  Floating above the page — dropdowns, tooltips, popovers (relies on shadow/border)
 *
 * on-surface:         Primary text (AAA 7:1)
 * on-surface-variant: Secondary text — lightest value that still meets AA 4.5:1 against surface
 */
function generateSurfaceColors(
  primary: Color,
  isDarkMode: boolean,
): {
  surface: Color
  onSurface: Color
  onSurfaceVariant: Color
  container: Color
  containerSunken: Color
  containerOverlay: Color
} {
  const surface = primary.clone()
  surface.oklch.c = isDarkMode ? 0.005 : 0.010
  surface.oklch.l = isDarkMode ? 0.12 : 0.99

  const onSurface = primary.clone()
  onSurface.oklch.c = 0.01
  onSurface.oklch.l = isDarkMode ? 0.95 : 0.1
  const onSurfaceAdjusted = ensureContrast(onSurface, surface, 7.0)

  // Always search for the lightest (light mode) or darkest-usable (dark mode) value
  // that meets AA 4.5:1 — never settle for an arbitrarily dark starting guess
  const onSurfaceVariant = primary.clone()
  onSurfaceVariant.oklch.c = 0.01
  const onSurfaceVariantAdjusted = findOptimalLightness(onSurfaceVariant, surface, 4.5)

  // container: cards, dialogs — Carbon-level ΔL ≈ 0.07–0.08 from surface
  const container = primary.clone()
  container.oklch.c = isDarkMode ? 0.008 : 0.014
  container.oklch.l = isDarkMode ? 0.20 : 0.92

  // container-sunken: inset wells — slightly recessed from surface
  const containerSunken = primary.clone()
  containerSunken.oklch.c = isDarkMode ? 0.006 : 0.012
  containerSunken.oklch.l = isDarkMode ? 0.08 : 0.96

  // container-overlay: floating elements — same L as surface in light mode (shadow does the work),
  // clearly lighter than surface in dark mode
  const containerOverlay = primary.clone()
  containerOverlay.oklch.c = isDarkMode ? 0.010 : 0.010
  containerOverlay.oklch.l = isDarkMode ? 0.24 : 0.99

  return {
    surface,
    onSurface: onSurfaceAdjusted,
    onSurfaceVariant: onSurfaceVariantAdjusted,
    container,
    containerSunken,
    containerOverlay,
  }
}

// ===== OUTLINE AND INVERSE COLORS =====

function generateOutlineAndInverse(
  primary: Color,
  isDarkMode: boolean,
  surface: Color,
): {
  outline: Color
  outlineVariant: Color
  inverseSurface: Color
  onInverseSurface: Color
} {
  const outlineBase = primary.clone()
  outlineBase.oklch.c = 0.01

  const outline = outlineBase.clone()
  outline.oklch.l = isDarkMode ? 0.7 : 0.4
  const outlineAdjusted = ensureContrast(outline, surface, 3.0)

  // Lightest value that still meets 3:1 against surface (same optimal-search as on-surface-variant)
  const outlineVariant = findOptimalLightness(outlineBase, surface, 3.0)

  const inverseSurface = primary.clone()
  inverseSurface.oklch.c = 0.005
  inverseSurface.oklch.l = isDarkMode ? 0.9 : 0.2

  const onInverseSurface = primary.clone()
  onInverseSurface.oklch.c = 0.005
  onInverseSurface.oklch.l = isDarkMode ? 0.2 : 0.95
  const onInverseSurfaceAdjusted = ensureContrast(onInverseSurface, inverseSurface, 7.0)

  return {
    outline: outlineAdjusted,
    outlineVariant,
    inverseSurface,
    onInverseSurface: onInverseSurfaceAdjusted,
  }
}

// ===== SEMANTIC COLOR GENERATION =====

/**
 * Returns the closest-hue palette color within tolerance, or null.
 */
function findPaletteColorByHue(palette: BaseColorData[], targetHue: number, tolerance: number = 30): Color | null {
  let bestMatch: Color | null = null
  let bestDistance = Infinity

  for (const item of palette) {
    if (item?.color?.oklch?.h !== undefined) {
      const hue = item.color.oklch.h
      const diff = Math.abs(hue - targetHue)
      const distance = Math.min(diff, 360 - diff)
      if (distance <= tolerance && distance < bestDistance) {
        bestDistance = distance
        bestMatch = item.color.clone()
      }
    }
  }
  return bestMatch
}

function getAverageChroma(palette: BaseColorData[]): number {
  const chromas = palette.filter(item => item?.color?.oklch?.c !== undefined).map(item => item.color.oklch.c)
  if (chromas.length === 0) return 0.1
  return chromas.reduce((sum, c) => sum + c, 0) / chromas.length
}

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

  // Error: red (hue 22 in OKLCH — distinct red, not orange)
  const errorBase =
    findPaletteColorByHue(palette, 22) ||
    (() => {
      const fallback = primary.clone()
      fallback.oklch.h = 22
      fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
      return fallback
    })()

  // Success: green (hue 140)
  const successBase =
    findPaletteColorByHue(palette, 140) ||
    (() => {
      const fallback = primary.clone()
      fallback.oklch.h = 140
      fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
      return fallback
    })()

  // Warning: amber/yellow (hue 95 in OKLCH — warm yellow, not lime-green)
  const warningBase =
    findPaletteColorByHue(palette, 95) ||
    (() => {
      const fallback = primary.clone()
      fallback.oklch.h = 95
      fallback.oklch.c = Math.min(Math.max(avgChroma * 0.9, 0.1), 0.15)
      return fallback
    })()

  const error = errorBase.clone()
  error.oklch.l = isDarkMode ? 0.8 : 0.4

  const onError = errorBase.clone()
  onError.oklch.l = isDarkMode ? 0.2 : 1.0
  const onErrorAdjusted = ensureContrast(onError, error, 4.5)

  const success = successBase.clone()
  success.oklch.l = isDarkMode ? 0.8 : 0.4

  const onSuccess = successBase.clone()
  onSuccess.oklch.l = isDarkMode ? 0.2 : 1.0
  const onSuccessAdjusted = ensureContrast(onSuccess, success, 4.5)

  const warning = warningBase.clone()
  warning.oklch.l = isDarkMode ? 0.7 : 0.5

  const onWarning = warningBase.clone()
  onWarning.oklch.l = isDarkMode ? 0.2 : 0.1
  const onWarningAdjusted = ensureContrast(onWarning, warning, 4.5)

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
  // Step 1: Adapt primary — preserved as-is in the mode where it has greatest contrast
  const primary = adaptPrimaryForMode(color, isDarkMode)

  // Step 2: Primary colors with proper contrast
  const primaryContainer = primary.clone()
  primaryContainer.oklch.l = isDarkMode ? 0.3 : 0.9

  const onPrimary = primary.clone()
  onPrimary.oklch.l = isDarkMode ? 0.2 : 1.0
  const onPrimaryAdjusted = ensureContrast(onPrimary, primary, 4.5)

  const onPrimaryContainer = primary.clone()
  onPrimaryContainer.oklch.l = isDarkMode ? 0.9 : 0.1
  const onPrimaryContainerAdjusted = ensureContrast(onPrimaryContainer, primaryContainer, 4.5)

  // Step 3: Surface colors (AAA contrast) — generated before accents so surface is available
  const surfaces = generateSurfaceColors(primary, isDarkMode)

  // Step 4: Accent colors — ensured to contrast with surface (3:1, WCAG non-text UI components)
  const { secondary: secondaryRaw, tertiary: tertiaryRaw } = selectAccentColors(paletteType, palette, primary)
  const secondary = ensureContrast(secondaryRaw, surfaces.surface, 3.0)
  const tertiary = ensureContrast(tertiaryRaw, surfaces.surface, 3.0)

  const onSecondary = secondary.clone()
  onSecondary.oklch.l = isDarkMode ? 0.2 : 1.0
  const onSecondaryAdjusted = ensureContrast(onSecondary, secondary, 4.5)

  const onTertiary = tertiary.clone()
  onTertiary.oklch.l = isDarkMode ? 0.2 : 1.0
  const onTertiaryAdjusted = ensureContrast(onTertiary, tertiary, 4.5)

  // Step 5: Outline and inverse colors
  const outlineInverse = generateOutlineAndInverse(primary, isDarkMode, surfaces.surface)

  // Step 6: Semantic colors (AA contrast)
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
    colorFactory(surfaces.containerSunken, 'container-sunken', 0, colorFormat, false, true),
    colorFactory(surfaces.containerOverlay, 'container-overlay', 0, colorFormat, false, true),

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
