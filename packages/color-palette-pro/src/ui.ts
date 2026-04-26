import Color from "colorjs.io";
import { BaseColorData, colorFactory } from "./factory";
import { PaletteKinds, ColorFormat } from "./types";

// ===== CONTRAST-BASED COLOR GENERATION =====

/**
 * Binary search for the lightness value that minimally satisfies the contrast ratio.
 * Dark background → finds lowest L that still meets ratio.
 * Light background → finds highest L that still meets ratio.
 */
function findOptimalLightness(
  baseColor: Color,
  background: Color,
  minRatio: number,
): Color {
  const backgroundL = background.oklch.l;
  const needLightForeground = backgroundL < 0.5;

  let minL = 0;
  let maxL = 1;
  let bestColor = baseColor.clone();

  for (let i = 0; i < 20; i++) {
    const testL = (minL + maxL) / 2;
    const testColor = baseColor.clone();
    testColor.oklch.l = testL;

    const contrast = testColor.contrastWCAG21(background);

    if (contrast >= minRatio) {
      bestColor = testColor.clone();
      if (needLightForeground) {
        maxL = testL; // found a working L; try to go lower (closer to background)
      } else {
        minL = testL; // found a working L; try to go higher (closer to background)
      }
    } else {
      if (needLightForeground) {
        minL = testL; // too dark; need to go lighter
      } else {
        maxL = testL; // too light; need to go darker
      }
    }

    if (Math.abs(maxL - minL) < 0.0001) break;
  }

  return bestColor;
}

/**
 * Generates an accessible (4.5:1 or 7:1) version of a color to sit on a background.
 * It targets Tone 90 or Tone 10 for a clean "on-color" look.
 */
function getAccessibleVariant(
  color: Color,
  background: Color,
  minRatio: number,
): Color {
  const backgroundL = background.oklch.l;
  const isDarkBg = backgroundL < 0.5;
  const target = color.clone();

  // Force minimum chroma for the foreground so it doesn't just turn gray
  target.oklch.c = Math.max(target.oklch.c, 0.06);

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
): Color {
  if (color.contrastWCAG21(background) >= minRatio) {
    return color.clone();
  }
  // If it's a UI element (3:1), we find the minimal shift. 
  // If it's text (4.5:1), we use getAccessibleVariant for a cleaner look.
  if (minRatio >= 4.5) {
    return getAccessibleVariant(color, background, minRatio);
  }
  return findOptimalLightness(color, background, minRatio);
}

// ===== PRIMARY COLOR ADAPTATION =====

/**
 * Ensures the primary color contrasts with the surface of the mode.
 * Light mode: Ensure primary is dark enough to sit on light surface.
 * Dark mode: Ensure primary is light enough to sit on dark surface.
 */
function adaptPrimaryForMode(primary: Color, isDarkMode: boolean): Color {
  const surfaceL = isDarkMode ? 0.14 : 0.98;
  const surface = primary.clone();
  surface.oklch.l = surfaceL;
  surface.oklch.c = 0;

  // We want the primary to be a distinct "element" on the surface.
  // M3 uses Tone 40 (L=0.4) for Light and Tone 80 (L=0.8) for Dark.
  // We'll require 4.5:1 contrast against the surface.
  if (primary.contrastWCAG21(surface) >= 4.5) {
    return primary.clone();
  }

  const target = primary.clone();
  target.oklch.l = isDarkMode ? 0.8 : 0.4;

  return findOptimalLightness(target, surface, 4.5);
}

function surfaceChromaFor(primary: Color, isDarkMode: boolean): number {
  return isDarkMode
    ? Math.min(primary.oklch.c * 0.03, 0.004)
    : Math.min(primary.oklch.c * 0.015, 0.002);
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
    accent.oklch.c = Math.min(accent.oklch.c, 0.08);
  } else {
    // Tertiary: Vibrant accent (Target Chroma ~0.08-0.12)
    accent.oklch.c = Math.min(accent.oklch.c, 0.12);
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
    fallback.oklch.h = (fallback.oklch.h + index * 60) % 360;
    fallback.oklch.c = Math.min(fallback.oklch.c * 0.8, 0.12);
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
function generateSurfaceColors(
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
  const surface = primary.clone();
  surface.oklch.c = surfaceChromaFor(primary, isDarkMode);
  surface.oklch.l = isDarkMode ? 0.14 : 0.98;

  // container: Standard cards — ΔL ≈ 0.04–0.05 from surface
  const container = primary.clone();
  container.oklch.c = isDarkMode
    ? Math.min(primary.oklch.c * 0.05, 0.006)
    : Math.min(primary.oklch.c * 0.025, 0.003);
  container.oklch.l = isDarkMode ? 0.19 : 0.94;

  // container-sunken: Inset wells — recessed below surface or container
  const containerSunken = primary.clone();
  containerSunken.oklch.c = isDarkMode
    ? Math.min(primary.oklch.c * 0.02, 0.003)
    : Math.min(primary.oklch.c * 0.01, 0.001);
  containerSunken.oklch.l = isDarkMode ? 0.10 : 0.90;

  // container-overlay: Floating elements — white in light mode (shadows provide separation),
  // visibly elevated above container in dark mode
  const containerOverlay = primary.clone();
  containerOverlay.oklch.c = isDarkMode
    ? Math.min(primary.oklch.c * 0.06, 0.008)
    : 0;
  containerOverlay.oklch.l = isDarkMode ? 0.25 : 1.0;

  // Worst-case background for contrast checking:
  // Light Mode (Dark Text): Lowest contrast occurs on the darkest background (sunken)
  // Dark Mode (Light Text): Lowest contrast occurs on the lightest background (overlay)
  const worstCaseBackground = isDarkMode ? containerOverlay : containerSunken;

  const onSurface = primary.clone();
  onSurface.oklch.c = 0.01;
  onSurface.oklch.l = isDarkMode ? 0.95 : 0.1;
  const onSurfaceAdjusted = ensureContrast(onSurface, worstCaseBackground, 7.0);

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

/**
 * Returns the closest-hue palette color within tolerance, or null.
 */
function findPaletteColorByHue(
  palette: BaseColorData[],
  targetHue: number,
  tolerance: number = 30,
): Color | null {
  let bestMatch: Color | null = null;
  let bestDistance = Infinity;

  for (const item of palette) {
    if (item?.color?.oklch?.h !== undefined) {
      const hue = item.color.oklch.h;
      const diff = Math.abs(hue - targetHue);
      const distance = Math.min(diff, 360 - diff);
      if (distance <= tolerance && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = item.color.clone();
      }
    }
  }
  return bestMatch;
}

function getMedianChroma(palette: BaseColorData[]): number {
  const chromas = palette
    .filter((item) => item?.color?.oklch?.c !== undefined)
    .map((item) => item.color.oklch.c)
    .sort((a, b) => a - b);
  if (chromas.length === 0) return 0.1;
  const mid = Math.floor(chromas.length / 2);
  return chromas.length % 2 === 0
    ? (chromas[mid - 1] + chromas[mid]) / 2
    : chromas[mid];
}

function generateSemanticColors(
  primary: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
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
    findPaletteColorByHue(palette, 27) ||
    (() => {
      const fallback = primary.clone();
      fallback.oklch.h = 27;
      fallback.oklch.c = Math.min(Math.max(medianChroma * 0.9, 0.1), 0.15);
      return fallback;
    })();

  // Success: green (hue 140)
  const successBase =
    findPaletteColorByHue(palette, 140) ||
    (() => {
      const fallback = primary.clone();
      fallback.oklch.h = 140;
      fallback.oklch.c = Math.min(Math.max(medianChroma * 0.9, 0.1), 0.15);
      return fallback;
    })();

  // Warning: amber (hue 83 in OKLCH)
  const warningBase =
    findPaletteColorByHue(palette, 83) ||
    (() => {
      const fallback = primary.clone();
      fallback.oklch.h = 83;
      fallback.oklch.c = Math.min(Math.max(medianChroma * 0.9, 0.1), 0.15);
      return fallback;
    })();

  const error = errorBase.clone();
  error.oklch.l = isDarkMode ? 0.8 : 0.4;
  const onError = getAccessibleVariant(error, error, 4.5);

  const success = successBase.clone();
  success.oklch.l = isDarkMode ? 0.8 : 0.4;
  const onSuccess = getAccessibleVariant(success, success, 4.5);

  const warning = warningBase.clone();
  warning.oklch.l = isDarkMode ? 0.7 : 0.5;
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

// ===== MAIN PALETTE GENERATION =====

export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
  colorFormat: ColorFormat,
): BaseColorData[] {
  // Step 1: Adapt primary family roles
  const isNaturallyLight = color.oklch.l > 0.5;

  let primary: Color;

  if (isNaturallyLight) {
    if (isDarkMode) {
      primary = adaptPrimaryForMode(color, true); // Target Tone 80
    } else {
      primary = color.clone();
      primary.oklch.l = 0.35; // Dark Primary (Tone 35)
    }
  } else {
    if (isDarkMode) {
      primary = color.clone();
      primary.oklch.l = 0.8; // Light Primary (Tone 80)
    } else {
      primary = adaptPrimaryForMode(color, false); // Target Tone 40
    }
  }

  // Primary container: M3 Tone 90 (light) / Tone 30 (dark), tinted surface
  // Chroma is scaled down so the container reads as a surface wash, not a saturated block.
  const primaryContainer = primary.clone();
  primaryContainer.oklch.l = isDarkMode ? 0.30 : 0.90;
  primaryContainer.oklch.c = Math.min(primary.oklch.c * 0.4, 0.10);

  const onPrimary = getAccessibleVariant(primary, primary, 4.5);

  // on-primary-container: same hue as container, boosted chroma for legibility vs. the soft surface
  const onPrimaryContainerBase = primaryContainer.clone();
  onPrimaryContainerBase.oklch.c = Math.min(primary.oklch.c * 0.7, 0.16);
  const onPrimaryContainer = getAccessibleVariant(onPrimaryContainerBase, primaryContainer, 4.5);

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

  // Step 5: Outline and inverse colors
  const outlineInverse = generateOutlineAndInverse(
    primary,
    isDarkMode,
    surfaces.surface,
    surfaces.onSurface,
  );

  // Step 6: Semantic colors (AA contrast)
  const semantic = generateSemanticColors(primary, palette, isDarkMode);

  // Step 7: Return exactly 24 colors in consistent order
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

    // Secondary colors (2)
    colorFactory(secondary, "secondary", 0, colorFormat, false, true),
    colorFactory(onSecondary, "on-secondary", 0, colorFormat, false, true),

    // Tertiary colors (2)
    colorFactory(tertiary, "tertiary", 0, colorFormat, false, true),
    colorFactory(onTertiary, "on-tertiary", 0, colorFormat, false, true),

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

    // Semantic colors (6)
    colorFactory(semantic.error, "error", 0, colorFormat, false, true),
    colorFactory(semantic.onError, "on-error", 0, colorFormat, false, true),
    colorFactory(semantic.success, "success", 0, colorFormat, false, true),
    colorFactory(semantic.onSuccess, "on-success", 0, colorFormat, false, true),
    colorFactory(semantic.warning, "warning", 0, colorFormat, false, true),
    colorFactory(semantic.onWarning, "on-warning", 0, colorFormat, false, true),
  ];
}
