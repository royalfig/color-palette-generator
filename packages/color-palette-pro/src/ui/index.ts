import Color from "colorjs.io";
import { BaseColorData, colorFactory } from "../factory";
import { ColorFormat, PaletteKinds, PaletteStyle } from "../types/types";
import {
  adaptPrimaryForMode,
  getAccessibleVariant,
  surfaceTreatmentFor,
} from "./uiUtils";
import { makeContainerForAccent, generateSurfaceColors } from "./surface";
import { selectAccentColors } from "./accentColors";
import { findLightnessFromTarget } from "./uiUtils";
import { generateOutlineAndInverse } from "./outline";
import { generateSemanticColors } from "./semantic";

// ===== MAIN PALETTE GENERATION =====
export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
  colorFormat: ColorFormat,
  paletteStyle: PaletteStyle = "square",
): BaseColorData[] {
  // Per-style surface material treatment — neutral (square) → brutalist (diamond).
  const treatment = surfaceTreatmentFor(paletteStyle);

  const isNaturallyLight = (color.oklch.l ?? 0.5) > 0.5;
  // Naturally-light + light mode used to bias slightly darker (Tone 35); preserve that.
  const primaryTargetL = isNaturallyLight && !isDarkMode ? 0.35 : undefined;
  const primary = adaptPrimaryForMode(color, isDarkMode, primaryTargetL);

  const onPrimary = getAccessibleVariant(primary, primary, 4.5);
  const { container: primaryContainer, onContainer: onPrimaryContainer } =
    makeContainerForAccent(primary, isDarkMode);

  // Step 3: Surface colors (AAA contrast) — generated before accents so surface is available
  const surfaces = generateSurfaceColors(primary, isDarkMode, treatment);

  // Step 4: Accent colors — adapted for the current mode
  const { secondary: secondaryRaw, tertiary: tertiaryRaw } = selectAccentColors(
    paletteType,
    palette,
    primary,
  );

  // Secondary and Tertiary follow the same lightness targets as Primary (OKLCH L 0.4 light /
  // 0.8 dark, picked so the on-color lands on the opposite pole). We assign the target L and
  // then VERIFY it against the surface, searching outward only if needed — previously the L
  // was hard-assigned with no contrast check, so these were accessible only by luck of the
  // accent's chroma. (Audit 2C.1.)
  const verifyAgainstSurface = (c: Color, targetL: number): Color => {
    const out = c.clone();
    out.oklch.l = targetL;
    if (out.contrastWCAG21(surfaces.surface) >= 4.5) return out;
    return findLightnessFromTarget(out, surfaces.surface, 4.5, targetL);
  };
  const accentTargetL = isDarkMode ? 0.8 : 0.4;
  const secondary = verifyAgainstSurface(secondaryRaw, accentTargetL);
  const tertiary = verifyAgainstSurface(tertiaryRaw, accentTargetL);

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
    treatment,
  );

  // Step 6: Semantic colors (AA contrast) — clamped against surface so inline use is safe
  const semantic = generateSemanticColors(
    primary,
    palette,
    isDarkMode,
    surfaces.surface,
  );

  const { container: errorContainer, onContainer: onErrorContainer } =
    makeContainerForAccent(semantic.error, isDarkMode);
  const { container: successContainer, onContainer: onSuccessContainer } =
    makeContainerForAccent(semantic.success, isDarkMode);
  const { container: warningContainer, onContainer: onWarningContainer } =
    makeContainerForAccent(semantic.warning, isDarkMode);

  // Interaction-state & utility tokens (Audit 4C/4D — the set was previously missing every
  // hover/pressed/disabled state plus scrim/shadow, so a real UI couldn't be built from it).
  // M3 state layers = the on-color composited over the base at a fixed opacity; we bake those
  // to solid tokens (hover 8%, pressed 12%). scrim/shadow are pure black for consumers to apply
  // at their own alpha (modal backdrops, elevation shadows — the latter is what lets near-white
  // light-mode overlays read as elevated).
  const stateLayer = (base: Color, on: Color, opacity: number): Color =>
    base
      .clone()
      .mix(on, opacity, { space: "srgb", outputSpace: "srgb" }) as Color;
  const primaryHover = stateLayer(primary, onPrimary, 0.08);
  const primaryPressed = stateLayer(primary, onPrimary, 0.12);

  const scrim = new Color("oklch", [0, 0, 0]);
  const shadow = new Color("oklch", [0, 0, 0]);

  // Disabled: neutral, low-emphasis (hue-stripped so it reads as inactive).
  const onDisabled = surfaces.onSurfaceVariant.clone();
  onDisabled.oklch.c = 0;
  onDisabled.oklch.l = isDarkMode ? 0.45 : 0.62;
  const disabledContainer = surfaces.surface.clone();
  disabledContainer.oklch.c = 0;
  disabledContainer.oklch.l = isDarkMode ? 0.26 : 0.93;

  // Step 7: Return tokens in consistent order (count derived from the roles below, not fixed).
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
    colorFactory(
      secondaryContainer,
      "secondary-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      onSecondaryContainer,
      "on-secondary-container",
      0,
      colorFormat,
      false,
      true,
    ),

    // Tertiary colors (4)
    colorFactory(tertiary, "tertiary", 0, colorFormat, false, true),
    colorFactory(onTertiary, "on-tertiary", 0, colorFormat, false, true),
    colorFactory(
      tertiaryContainer,
      "tertiary-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      onTertiaryContainer,
      "on-tertiary-container",
      0,
      colorFormat,
      false,
      true,
    ),

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
    colorFactory(
      outlineInverse.outline,
      "outline",
      0,
      colorFormat,
      false,
      true,
    ),
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
    colorFactory(
      errorContainer,
      "error-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      onErrorContainer,
      "on-error-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(semantic.success, "success", 0, colorFormat, false, true),
    colorFactory(semantic.onSuccess, "on-success", 0, colorFormat, false, true),
    colorFactory(
      successContainer,
      "success-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      onSuccessContainer,
      "on-success-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(semantic.warning, "warning", 0, colorFormat, false, true),
    colorFactory(semantic.onWarning, "on-warning", 0, colorFormat, false, true),
    colorFactory(
      warningContainer,
      "warning-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      onWarningContainer,
      "on-warning-container",
      0,
      colorFormat,
      false,
      true,
    ),

    // Interaction states + disabled + utility (Audit 4C/4D)
    colorFactory(primaryHover, "primary-hover", 0, colorFormat, false, true),
    colorFactory(
      primaryPressed,
      "primary-pressed",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(onDisabled, "on-disabled", 0, colorFormat, false, true),
    colorFactory(
      disabledContainer,
      "disabled-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(scrim, "scrim", 0, colorFormat, false, true),
    colorFactory(shadow, "shadow", 0, colorFormat, false, true),
  ];
}
