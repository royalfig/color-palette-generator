import Color from "colorjs.io";
import { SurfaceTreatment } from "../types/types";
import { DEFAULT_TREATMENT } from "./uiConst";
import {
  dampedSurfaceChroma,
  ensureContrast,
  getAccessibleVariant,
  surfaceChromaFor,
} from "./uiUtils";
import { findOptimalLightness } from "./colorMath";

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
  treatment: SurfaceTreatment = DEFAULT_TREATMENT,
): {
  surface: Color;
  onSurface: Color;
  onSurfaceVariant: Color;
  container: Color;
  containerSunken: Color;
  containerOverlay: Color;
} {
  const primaryC = primary.oklch.c ?? 0;
  const containerC = treatment.containerChromaScale;
  const proxBoost = treatment.minProximityBoost;

  const baseSurfaceL = isDarkMode ? 0.23 : 0.99;
  const stackShift = isDarkMode
    ? treatment.stackLShiftDark
    : treatment.stackLShiftLight;
  const clampL = (l: number): number => Math.max(0.02, Math.min(0.998, l));
  const surfaceL = clampL(baseSurfaceL + stackShift);

  const surface = primary.clone();
  surface.oklch.l = surfaceL;
  surface.oklch.c = surfaceChromaFor(primary, isDarkMode, treatment, surfaceL);

  // Elevation tiers are placed relative to the UNSHIFTED surface reference: the whole stack
  // shifts together by stackShift (diamond deepens dark / off-whites light so the page can hold
  // a tone), then elevationSpread widens the steps around the shifted surface.
  const spreadL = (tierL: number): number =>
    clampL(surfaceL + (tierL - baseSurfaceL) * treatment.elevationSpread);

  // container: Standard cards — the most tinted of the stack (furthest from paper in light mode,
  // so the damping lets the brand tint actually show here). (Audit 4B.)
  const container = primary.clone();
  const containerL = spreadL(isDarkMode ? 0.27 : 0.96);
  container.oklch.l = containerL;
  // Dark containers sit at a lower (more mid) lightness, so they tolerate more chroma before
  // reading as oversaturated — give dark a higher intended so its tint matches the light card.
  container.oklch.c = dampedSurfaceChroma(
    primaryC,
    containerL,
    isDarkMode,
    (isDarkMode ? 0.032 : 0.018) * containerC,
    0.34 + proxBoost,
  );

  // container-sunken: Inset wells — recessed below surface or container
  const containerSunken = primary.clone();
  const sunkenL = spreadL(isDarkMode ? 0.18 : 0.935);
  containerSunken.oklch.l = sunkenL;
  containerSunken.oklch.c = dampedSurfaceChroma(
    primaryC,
    sunkenL,
    isDarkMode,
    (isDarkMode ? 0.024 : 0.014) * containerC,
    0.26 + proxBoost,
  );

  // container-overlay: Floating elements. Near-white in light mode → the damping makes it
  // essentially neutral, so it relies on the `shadow` token to read as elevated (see
  // generateUiColorPalette); visibly lifted (and faintly tinted) in dark.
  const containerOverlay = primary.clone();
  const overlayL = spreadL(isDarkMode ? 0.31 : 0.995);
  containerOverlay.oklch.l = overlayL;
  containerOverlay.oklch.c = dampedSurfaceChroma(
    primaryC,
    overlayL,
    isDarkMode,
    0.014 * containerC,
    0 + proxBoost,
  );

  // Worst-case background for contrast checking, WITHIN THE NEUTRAL SURFACE STACK:
  // Light Mode (Dark Text): Lowest contrast occurs on the darkest background (sunken)
  // Dark Mode (Light Text): Lowest contrast occurs on the lightest background (overlay)
  // Scope caveat: on-surface / on-surface-variant are guaranteed only against these neutral
  // surfaces. They are NOT verified against the tinted accent containers (primary-container,
  // error-container, …) — text on those should use the matching on-*-container token, which
  // makeContainerForAccent verifies separately. (Audit 2D.3.)
  const worstCaseBackground = isDarkMode ? containerOverlay : containerSunken;

  const onSurface = primary.clone();
  onSurface.oklch.c = 0.01;
  onSurface.oklch.l = isDarkMode ? 0.95 : 0.1;
  // chromaFloor=0: body text stays near-neutral even if a fallback adjustment fires.
  const onSurfaceAdjusted = ensureContrast(
    onSurface,
    worstCaseBackground,
    7.0,
    0,
  );

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

/**
 * Push error/warning/success apart in lightness until each pair clears a minimum perceptual
 * distance *under deuteranopia + protanopia simulation*. Without this, red error and green
 * success — the single most confusable CVD pair — can render near-identical. We only move
 * lightness (cheap, monotonic, doesn't break the canonical hue identity).
 */

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
  container.oklch.l = isDarkMode ? 0.3 : 0.9;
  container.oklch.c = Math.min(accentC * 0.4, 0.1);

  const onContainerBase = container.clone();
  onContainerBase.oklch.c = Math.min(accentC * 0.7, 0.16);
  const onContainer = getAccessibleVariant(onContainerBase, container, 4.5);

  return { container, onContainer };
}
