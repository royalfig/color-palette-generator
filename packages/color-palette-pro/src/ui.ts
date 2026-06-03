import Color from "colorjs.io";
import { BaseColorData, colorFactory } from "./factory";
import { PaletteKinds, ColorFormat } from "./types";
import { findOptimalLightness, getMedianChroma, findColorByHue } from "./color-math";

// ===== CONTRAST-BASED COLOR GENERATION =====

/**
 * Searches outward from a preferred lightness until the contrast ratio is met.
 * Use this when you want to stay as close to a target tone as possible
 * (e.g. brand primary at Tone 40), rather than the minimum-satisfying L.
 */
function findLightnessFromTarget(
  baseColor: Color,
  background: Color,
  minRatio: number,
  preferredL: number,
): Color {
  const backgroundL = background.oklch.l ?? 0.5;
  const direction = backgroundL < 0.5 ? 1 : -1; // dark bg → go lighter; light bg → go darker
  const result = baseColor.clone();

  for (let step = 0; step <= 100; step++) {
    const testL = preferredL + direction * step * 0.01;
    if (testL < 0 || testL > 1) break;
    result.oklch.l = testL;
    if (result.contrastWCAG21(background) >= minRatio) return result;
  }

  result.oklch.l = direction === 1 ? 0.98 : 0.02;
  return result;
}

/**
 * Generates an accessible (4.5:1 or 7:1) version of a color to sit on a background.
 * It targets Tone 90 or Tone 10 for a clean "on-color" look.
 *
 * `chromaFloor` is the minimum chroma the result will carry. Default 0.06 keeps
 * accent on-colors (on-primary, on-error, …) visibly tinted. Pass 0 when the
 * caller is neutral body text (on-surface) and should not be forced chromatic.
 */
function getAccessibleVariant(
  color: Color,
  background: Color,
  minRatio: number,
  chromaFloor: number = 0.06,
): Color {
  const backgroundL = background.oklch.l ?? 0.5;
  const isDarkBg = backgroundL < 0.5;
  const target = color.clone();

  target.oklch.c = Math.max(target.oklch.c ?? 0, chromaFloor);

  // Target high-contrast levels (Tone 90 for dark backgrounds, Tone 10 for light)
  target.oklch.l = isDarkBg ? 0.9 : 0.12;

  if (target.contrastWCAG21(background) >= minRatio) {
    return target;
  }

  // If that's not enough contrast (extreme background), go to the poles
  target.oklch.l = isDarkBg ? 0.98 : 0.02;
  if (target.contrastWCAG21(background) >= minRatio) {
    return target;
  }

  // Absolute fallback: search for the limit (though Tone 0.02/0.98 should almost always work)
  return findOptimalLightness(target, background, minRatio);
}

function ensureContrast(
  color: Color,
  background: Color,
  minRatio: number,
  chromaFloor: number = 0.06,
): Color {
  if (color.contrastWCAG21(background) >= minRatio) {
    return color.clone();
  }
  // If it's a UI element (3:1), we find the minimal shift.
  // If it's text (4.5:1), we use getAccessibleVariant for a cleaner look.
  if (minRatio >= 4.5) {
    return getAccessibleVariant(color, background, minRatio, chromaFloor);
  }
  return findOptimalLightness(color, background, minRatio);
}

// ===== PRIMARY COLOR ADAPTATION =====

/**
 * Ensures the primary color contrasts with the surface of the mode.
 * Light mode: Ensure primary is dark enough to sit on light surface.
 * Dark mode: Ensure primary is light enough to sit on dark surface.
 */
export function adaptPrimaryForMode(
  primary: Color,
  isDarkMode: boolean,
  targetL?: number,
): Color {
  const surfaceL = isDarkMode ? 0.12 : 0.98;
  const surface = primary.clone();
  surface.oklch.l = surfaceL;
  surface.oklch.c = 0;

  // M3 uses Tone 40 (L=0.4) for Light and Tone 80 (L=0.8) for Dark by default.
  // Callers may override (e.g. naturally-light + light mode prefers L=0.35).
  const desiredL = targetL ?? (isDarkMode ? 0.8 : 0.4);
  const target = primary.clone();
  target.oklch.l = desiredL;

  if (target.contrastWCAG21(surface) >= 4.5) {
    return target;
  }

  // Search outward from the desired tone instead of converging on the minimum
  // (which would collapse the primary toward the surface lightness).
  return findLightnessFromTarget(target, surface, 4.5, desiredL);
}

function surfaceChromaFor(primary: Color, isDarkMode: boolean): number {
  const c = primary.oklch.c ?? 0;
  return isDarkMode
    ? Math.min(c * 0.03, 0.004)
    : Math.min(c * 0.015, 0.002);
}

// ===== ACCENT COLOR PREPARATION =====

/**
 * Prepares an accent color (secondary or tertiary) for UI use.
 * Desaturates for better UI integration while retaining some vibrancy from the source.
 */
function prepareAccentColor(
  baseColor: Color,
  role: "secondary" | "tertiary",
): Color {
  const accent = baseColor.clone();

  if (role === "secondary") {
    // Secondary: Muted harmony (Target Chroma ~0.04-0.08)
    accent.oklch.c = Math.min(accent.oklch.c ?? 0, 0.08);
  } else {
    // Tertiary: Vibrant accent (Target Chroma ~0.08-0.12)
    accent.oklch.c = Math.min(accent.oklch.c ?? 0, 0.12);
  }

  return accent;
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
      return palette[index].color.clone();
    }
    const fallback = primary.clone();
    fallback.oklch.h = ((fallback.oklch.h ?? 0) + index * 60) % 360;
    fallback.oklch.c = Math.min((fallback.oklch.c ?? 0) * 0.8, 0.12);
    return fallback;
  };

  let secondaryIndex: number;
  let tertiaryIndex: number;

  switch (paletteType) {
    case "com":
      secondaryIndex = 5; // Muted complement
      tertiaryIndex = 1; // Main complement
      break;
    case "spl":
      secondaryIndex = 3; // Muted split 1
      tertiaryIndex = 4; // Pure split 2
      break;
    case "tri":
      secondaryIndex = 3; // Muted triad hue 2
      tertiaryIndex = 4; // Pure triad hue 3
      break;
    case "tet":
      secondaryIndex = 3; // Muted hue 2
      tertiaryIndex = 4; // Pure hue 3
      break;
    case "ana":
      secondaryIndex = 2; // Subtle analogous shift
      tertiaryIndex = 5; // Distinct analogous accent
      break;
    case "tas": // Tints and shades — pick from the 12-color range
      secondaryIndex = 3; // Deeper shade
      tertiaryIndex = 8; // Lighter tint
      break;
    default:
      secondaryIndex = 1;
      tertiaryIndex = 4;
  }

  return {
    secondary: prepareAccentColor(safeGetColor(secondaryIndex), "secondary"),
    tertiary: prepareAccentColor(safeGetColor(tertiaryIndex), "tertiary"),
  };
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
export function generateSurfaceColors(
  primary: Color,
  isDarkMode: boolean,
): {
  surface: Color;
  onSurface: Color;
  onSurfaceVariant: Color;
  container: Color;
  containerSunken: Color;
  containerOverlay: Color;
} {
  const primaryC = primary.oklch.c ?? 0;

  const surface = primary.clone();
  surface.oklch.c = surfaceChromaFor(primary, isDarkMode);
  surface.oklch.l = isDarkMode ? 0.23 : 0.99;

  // container: Standard cards — ΔL ≈ 0.04 (light) / 0.04 (dark) from surface
  const container = primary.clone();
  container.oklch.c = isDarkMode
    ? Math.min(primaryC * 0.08, 0.012)
    : Math.min(primaryC * 0.04, 0.006);
  container.oklch.l = isDarkMode ? 0.27 : 0.965;

  // container-sunken: Inset wells — recessed below surface or container
  const containerSunken = primary.clone();
  containerSunken.oklch.c = isDarkMode
    ? Math.min(primaryC * 0.04, 0.006)
    : Math.min(primaryC * 0.02, 0.003);
  containerSunken.oklch.l = isDarkMode ? 0.18 : 0.935;

  // container-overlay: Floating elements — near-white in light mode with a whisper
  // of brand tint so it feels family-related; visibly elevated above container in dark.
  const containerOverlay = primary.clone();
  containerOverlay.oklch.c = isDarkMode
    ? Math.min(primaryC * 0.06, 0.008)
    : Math.min(primaryC * 0.02, 0.003);
  containerOverlay.oklch.l = isDarkMode ? 0.31 : 0.995;

  // Worst-case background for contrast checking:
  // Light Mode (Dark Text): Lowest contrast occurs on the darkest background (sunken)
  // Dark Mode (Light Text): Lowest contrast occurs on the lightest background (overlay)
  const worstCaseBackground = isDarkMode ? containerOverlay : containerSunken;

  const onSurface = primary.clone();
  onSurface.oklch.c = 0.01;
  onSurface.oklch.l = isDarkMode ? 0.95 : 0.1;
  // chromaFloor=0: body text stays near-neutral even if a fallback adjustment fires.
  const onSurfaceAdjusted = ensureContrast(onSurface, worstCaseBackground, 7.0, 0);

  // on-surface-variant: Secondary text — AA 4.5:1 against worst-case background
  const onSurfaceVariant = primary.clone();
  onSurfaceVariant.oklch.c = 0.01;
  const onSurfaceVariantAdjusted = findOptimalLightness(
    onSurfaceVariant,
    worstCaseBackground,
    4.5,
  );

  return {
    surface,
    onSurface: onSurfaceAdjusted,
    onSurfaceVariant: onSurfaceVariantAdjusted,
    container,
    containerSunken,
    containerOverlay,
  };
}

// ===== OUTLINE AND INVERSE COLORS =====

function generateOutlineAndInverse(
  primary: Color,
  isDarkMode: boolean,
  surface: Color,
  onSurface: Color,
): {
  outline: Color;
  outlineVariant: Color;
  inverseSurface: Color;
  onInverseSurface: Color;
} {
  const outlineBase = primary.clone();
  outlineBase.oklch.c = 0.005;

  const outline = outlineBase.clone();
  outline.oklch.l = isDarkMode ? 0.6 : 0.5;
  const outlineAdjusted = ensureContrast(outline, surface, 3.0);

  // outline-variant: Decorative dividers — subtle delta (~0.06) from surface
  const outlineVariant = outlineBase.clone();
  outlineVariant.oklch.l = isDarkMode ? 0.2 : 0.92;

  // Inverse colors: strictly neutral flips of the surface/on-surface
  const inverseSurface = onSurface.clone();
  inverseSurface.oklch.c = 0; // Truly neutral

  const onInverseSurface = surface.clone();
  onInverseSurface.oklch.c = 0; // Truly neutral

  return {
    outline: outlineAdjusted,
    outlineVariant,
    inverseSurface,
    onInverseSurface,
  };
}

// ===== SEMANTIC COLOR GENERATION =====

export function generateSemanticColors(
  primary: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  surface?: Color,
): {
  error: Color;
  onError: Color;
  success: Color;
  onSuccess: Color;
  warning: Color;
  onWarning: Color;
} {
  const medianChroma = getMedianChroma(palette);

  // Error: red (hue 27 in OKLCH)
  const errorBase =
    findColorByHue(palette, 27) ||
    (() => {
      const fallback = primary.clone();
      fallback.oklch.h = 27;
      fallback.oklch.c = Math.min(Math.max(medianChroma * 0.9, 0.1), 0.15);
      return fallback;
    })();

  // Success: green (hue 140)
  const successBase =
    findColorByHue(palette, 140) ||
    (() => {
      const fallback = primary.clone();
      fallback.oklch.h = 140;
      fallback.oklch.c = Math.min(Math.max(medianChroma * 0.9, 0.1), 0.15);
      return fallback;
    })();

  // Warning: amber (hue 83 in OKLCH)
  const warningBase =
    findColorByHue(palette, 83) ||
    (() => {
      const fallback = primary.clone();
      fallback.oklch.h = 83;
      fallback.oklch.c = Math.min(Math.max(medianChroma * 0.9, 0.1), 0.15);
      return fallback;
    })();

  // Step the semantic L back toward the surface only as far as needed to keep 4.5:1
  // — preserves the perceived hue while making inline use (text/icons on surface) safe.
  const clampAgainstSurface = (c: Color): Color => {
    if (!surface) return c;
    if (c.contrastWCAG21(surface) >= 4.5) return c;
    return findLightnessFromTarget(c, surface, 4.5, c.oklch.l ?? 0.5);
  };

  let error = errorBase.clone();
  error.oklch.l = isDarkMode ? 0.8 : 0.4;
  error = clampAgainstSurface(error);
  const onError = getAccessibleVariant(error, error, 4.5);

  let success = successBase.clone();
  success.oklch.l = isDarkMode ? 0.8 : 0.4;
  success = clampAgainstSurface(success);
  const onSuccess = getAccessibleVariant(success, success, 4.5);

  let warning = warningBase.clone();
  warning.oklch.l = isDarkMode ? 0.7 : 0.5;
  warning = clampAgainstSurface(warning);
  const onWarning = getAccessibleVariant(warning, warning, 4.5);

  return {
    error,
    onError,
    success,
    onSuccess,
    warning,
    onWarning,
  };
}

// ===== CONTAINER GENERATION =====

/**
 * Builds a soft container surface + accessible on-color for any accent family
 * (primary, secondary, tertiary, error, success, warning).
 *
 * Container sits at Tone 90 (light) / Tone 30 (dark) with reduced chroma so it
 * reads as a tinted wash. The on-color gets boosted chroma for legibility
 * against that soft background.
 */
export function makeContainerForAccent(
  accent: Color,
  isDarkMode: boolean,
): { container: Color; onContainer: Color } {
  const accentC = accent.oklch.c ?? 0;

  const container = accent.clone();
  container.oklch.l = isDarkMode ? 0.30 : 0.90;
  container.oklch.c = Math.min(accentC * 0.4, 0.10);

  const onContainerBase = container.clone();
  onContainerBase.oklch.c = Math.min(accentC * 0.7, 0.16);
  const onContainer = getAccessibleVariant(onContainerBase, container, 4.5);

  return { container, onContainer };
}

// ===== MAIN PALETTE GENERATION =====

export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
  colorFormat: ColorFormat,
): BaseColorData[] {
  // Step 1: Adapt primary family roles. All four branches route through
  // adaptPrimaryForMode so the assigned L is verified against surface contrast.
  const isNaturallyLight = (color.oklch.l ?? 0.5) > 0.5;
  // Naturally-light + light mode used to bias slightly darker (Tone 35); preserve that.
  const primaryTargetL = (isNaturallyLight && !isDarkMode) ? 0.35 : undefined;
  const primary = adaptPrimaryForMode(color, isDarkMode, primaryTargetL);

  const onPrimary = getAccessibleVariant(primary, primary, 4.5);
  const { container: primaryContainer, onContainer: onPrimaryContainer } =
    makeContainerForAccent(primary, isDarkMode);

  // Step 3: Surface colors (AAA contrast) — generated before accents so surface is available
  const surfaces = generateSurfaceColors(primary, isDarkMode);

  // Step 4: Accent colors — adapted for the current mode
  const { secondary: secondaryRaw, tertiary: tertiaryRaw } = selectAccentColors(
    paletteType,
    palette,
    primary,
  );

  // Secondary and Tertiary follow the same Tone targets as Primary:
  // Light mode → Tone 40 (dark, so on-color is light), Dark mode → Tone 80 (light, so on-color is dark).
  // Directly assigning L avoids adaptPrimaryForMode leaving them above 0.5 in light mode,
  // which would cause getAccessibleVariant to generate a dark (wrong) on-color.
  const secondary = secondaryRaw.clone();
  secondary.oklch.l = isDarkMode ? 0.8 : 0.4;
  const tertiary = tertiaryRaw.clone();
  tertiary.oklch.l = isDarkMode ? 0.8 : 0.4;

  const onSecondary = getAccessibleVariant(secondary, secondary, 4.5);
  const onTertiary = getAccessibleVariant(tertiary, tertiary, 4.5);

  const { container: secondaryContainer, onContainer: onSecondaryContainer } =
    makeContainerForAccent(secondary, isDarkMode);
  const { container: tertiaryContainer, onContainer: onTertiaryContainer } =
    makeContainerForAccent(tertiary, isDarkMode);

  // Step 5: Outline and inverse colors
  const outlineInverse = generateOutlineAndInverse(
    primary,
    isDarkMode,
    surfaces.surface,
    surfaces.onSurface,
  );

  // Step 6: Semantic colors (AA contrast) — clamped against surface so inline use is safe
  const semantic = generateSemanticColors(primary, palette, isDarkMode, surfaces.surface);

  const { container: errorContainer, onContainer: onErrorContainer } =
    makeContainerForAccent(semantic.error, isDarkMode);
  const { container: successContainer, onContainer: onSuccessContainer } =
    makeContainerForAccent(semantic.success, isDarkMode);
  const { container: warningContainer, onContainer: onWarningContainer } =
    makeContainerForAccent(semantic.warning, isDarkMode);

  // Step 7: Return 34 tokens in consistent order
  return [
    // Primary colors (4)
    colorFactory(primary, "primary", 0, colorFormat, false, true),
    colorFactory(onPrimary, "on-primary", 0, colorFormat, false, true),
    colorFactory(
      primaryContainer,
      "primary-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      onPrimaryContainer,
      "on-primary-container",
      0,
      colorFormat,
      false,
      true,
    ),

    // Secondary colors (4)
    colorFactory(secondary, "secondary", 0, colorFormat, false, true),
    colorFactory(onSecondary, "on-secondary", 0, colorFormat, false, true),
    colorFactory(secondaryContainer, "secondary-container", 0, colorFormat, false, true),
    colorFactory(onSecondaryContainer, "on-secondary-container", 0, colorFormat, false, true),

    // Tertiary colors (4)
    colorFactory(tertiary, "tertiary", 0, colorFormat, false, true),
    colorFactory(onTertiary, "on-tertiary", 0, colorFormat, false, true),
    colorFactory(tertiaryContainer, "tertiary-container", 0, colorFormat, false, true),
    colorFactory(onTertiaryContainer, "on-tertiary-container", 0, colorFormat, false, true),

    // Surface colors (3)
    colorFactory(surfaces.surface, "surface", 0, colorFormat, false, true),
    colorFactory(surfaces.onSurface, "on-surface", 0, colorFormat, false, true),
    colorFactory(
      surfaces.onSurfaceVariant,
      "on-surface-variant",
      0,
      colorFormat,
      false,
      true,
    ),

    // Container variants (3)
    colorFactory(surfaces.container, "container", 0, colorFormat, false, true),
    colorFactory(
      surfaces.containerSunken,
      "container-sunken",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      surfaces.containerOverlay,
      "container-overlay",
      0,
      colorFormat,
      false,
      true,
    ),

    // Outline (2)
    colorFactory(outlineInverse.outline, "outline", 0, colorFormat, false, true),
    colorFactory(
      outlineInverse.outlineVariant,
      "outline-variant",
      0,
      colorFormat,
      false,
      true,
    ),

    // Inverse (2)
    colorFactory(
      outlineInverse.inverseSurface,
      "inverse-surface",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      outlineInverse.onInverseSurface,
      "on-inverse-surface",
      0,
      colorFormat,
      false,
      true,
    ),

    // Semantic colors (12)
    colorFactory(semantic.error, "error", 0, colorFormat, false, true),
    colorFactory(semantic.onError, "on-error", 0, colorFormat, false, true),
    colorFactory(errorContainer, "error-container", 0, colorFormat, false, true),
    colorFactory(onErrorContainer, "on-error-container", 0, colorFormat, false, true),
    colorFactory(semantic.success, "success", 0, colorFormat, false, true),
    colorFactory(semantic.onSuccess, "on-success", 0, colorFormat, false, true),
    colorFactory(successContainer, "success-container", 0, colorFormat, false, true),
    colorFactory(onSuccessContainer, "on-success-container", 0, colorFormat, false, true),
    colorFactory(semantic.warning, "warning", 0, colorFormat, false, true),
    colorFactory(semantic.onWarning, "on-warning", 0, colorFormat, false, true),
    colorFactory(warningContainer, "warning-container", 0, colorFormat, false, true),
    colorFactory(onWarningContainer, "on-warning-container", 0, colorFormat, false, true),
  ];
}
