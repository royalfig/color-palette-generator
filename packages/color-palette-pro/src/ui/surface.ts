import Color from 'colorjs.io'
import { SurfaceTreatment } from '../types/types'
import { DEFAULT_TREATMENT } from './uiConst'
import { dampedSurfaceChroma, ensureContrast, getAccessibleVariant, surfaceChromaFor } from './uiUtils'
import { findOptimalLightness } from './colorMath'

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
  surface: Color
  onSurface: Color
  onSurfaceVariant: Color
  container: Color
  containerSunken: Color
  containerOverlay: Color
} {
  const primaryC = primary.oklch.c ?? 0
  const containerC = treatment.containerChromaScale
  const proxBoost = treatment.minProximityBoost

  // Surface stack anchored on Material 3's baseline scheme, measured in OKLCH:
  //
  //            M3 dark          M3 light
  //   surface  #141218  0.187   #FEF7FF  0.984
  //   +cards   #211F26  0.245   #F3EDF7  0.954   (surfaceContainer)
  //   +float   #2B2930  0.286   #ECE6F0  0.933   (surfaceContainerHigh — menus, dialogs)
  //   recessed #0F0D13  0.164   #E6E0E9  0.914   (Lowest in dark / Highest in light)
  //
  // Our tier semantics are kept: elevation moves lighter in dark and darker in light, and the
  // sunken well recedes from the surface in both. Only the lightness values are matched to M3.
  //
  // History, so it is not re-derived: this was 0.23 dark, and briefly 0.30. The 0.30 experiment
  // was justified by "at 0.23 a sunken tier is impossible (Lc 2.6)" — which came from measuring
  // two SURFACES with APCA. APCA is a text-on-background model that clamps low-contrast pairs to
  // zero, so it reports Lc 0.00 for two obviously different dark greys; in deltaE, the right
  // metric here, the sunken tier was always fine. Do not use APCA to compare two surfaces.
  const baseSurfaceL = isDarkMode ? 0.187 : 0.984
  const stackShift = isDarkMode ? treatment.stackLShiftDark : treatment.stackLShiftLight
  const clampL = (l: number): number => Math.max(0.02, Math.min(0.998, l))
  const surfaceL = clampL(baseSurfaceL + stackShift)

  const surface = primary.clone()
  surface.oklch.l = surfaceL
  surface.oklch.c = surfaceChromaFor(primary, isDarkMode, treatment, surfaceL)

  // Elevation tiers are placed relative to the UNSHIFTED surface reference: the whole stack
  // shifts together by stackShift (diamond deepens dark / off-whites light so the page can hold
  // a tone), then elevationSpread widens the steps around the shifted surface.
  const spreadL = (tierL: number): number => clampL(surfaceL + (tierL - baseSurfaceL) * treatment.elevationSpread)

  // container: Standard cards — the most tinted of the stack (furthest from paper in light mode,
  // so the damping lets the brand tint actually show here). (Audit 4B.)
  const container = primary.clone()
  const containerL = spreadL(isDarkMode ? 0.245 : 0.954) // M3 surfaceContainer
  container.oklch.l = containerL
  // Dark containers sit at a lower (more mid) lightness, so they tolerate more chroma before
  // reading as oversaturated — give dark a higher intended so its tint matches the light card.
  container.oklch.c = dampedSurfaceChroma(
    primaryC,
    containerL,
    isDarkMode,
    (isDarkMode ? 0.032 : 0.018) * containerC,
    0.34 + proxBoost,
  )

  // container-sunken: Inset wells — recessed below surface or container
  const containerSunken = primary.clone()
  // Light follows M3's surfaceContainerHighest (0.914), the most recessed light tier. Dark does
  // NOT use M3's surfaceContainerLowest (0.164): that sits only 0.023 under the surface, because
  // M3 has no recessed-well concept in dark — its dark text fields go LIGHTER, to
  // surfaceContainerHighest. Our sunken tier has to read as an inset (sidebars, inputs, the code
  // editor's chrome), so it needs a real step down. 0.148 gives deltaE ~3.5-5 against the
  // surface at every style, where M3's own value fell to 2.25 once the style spread compressed it.
  const sunkenL = spreadL(isDarkMode ? 0.148 : 0.914)
  containerSunken.oklch.l = sunkenL
  containerSunken.oklch.c = dampedSurfaceChroma(
    primaryC,
    sunkenL,
    isDarkMode,
    (isDarkMode ? 0.024 : 0.014) * containerC,
    0.26 + proxBoost,
  )

  // container-overlay: floating elements — menus, popovers, dialogs.
  //
  // Light mode used 0.995, which after the spread landed at L 0.994 against a surface of 0.991:
  // deltaE 0.30, a contrast ratio of 1.009. A popover had no edge at all and depended entirely on
  // the shadow to be seen. The mistake was carrying the dark-mode rule ("elevated = lighter")
  // into light mode, where there is no headroom above a near-white page. Both Material 3 and
  // Radix resolve this the same way: in light mode elevation moves AWAY from the page, which
  // means darker. M3 puts menus and dialogs on surfaceContainerHigh (L 0.938) over a surface of
  // L 0.984. So the light overlay is now a step beyond `container`, giving the ordering
  // surface 0.991 > container 0.961 > overlay 0.948 > sunken 0.934 — monotone, and the same
  // order M3 uses. Dark keeps "elevated = lighter", which is correct there.
  const containerOverlay = primary.clone()
  const overlayL = spreadL(isDarkMode ? 0.286 : 0.933) // M3 surfaceContainerHigh
  containerOverlay.oklch.l = overlayL
  containerOverlay.oklch.c = dampedSurfaceChroma(primaryC, overlayL, isDarkMode, 0.014 * containerC, 0 + proxBoost)

  // Worst-case background for contrast checking, WITHIN THE NEUTRAL SURFACE STACK:
  // Light Mode (Dark Text): Lowest contrast occurs on the darkest background (sunken)
  // Dark Mode (Light Text): Lowest contrast occurs on the lightest background (overlay)
  // Scope caveat: on-surface / on-surface-variant are guaranteed only against these neutral
  // surfaces. They are NOT verified against the tinted accent containers (primary-container,
  // error-container, …) — text on those should use the matching on-*-container token, which
  // makeContainerForAccent verifies separately. (Audit 2D.3.)
  const worstCaseBackground = isDarkMode ? containerOverlay : containerSunken

  const onSurface = primary.clone()
  onSurface.oklch.c = 0.01
  // Light body text was L 0.1 — #020306, effectively pure black, 19.8:1 on the surface. The
  // reference cluster sits at 15.8-17.1 (Material 3 16.2, Radix slate12 16.0, GitHub 15.8,
  // Tailwind 17.1); only Apple goes to pure black. L 0.23 lands at ~16:1, in the middle of that
  // band. Dark is left at 0.95, which already measures 16.1:1 — inside the dark reference band
  // of 14.3-17.4 (M3 14.3, Radix 16.2, Tailwind 16.3, GitHub 17.4).
  onSurface.oklch.l = isDarkMode ? 0.95 : 0.23
  // chromaFloor=0: body text stays near-neutral even if a fallback adjustment fires.
  const onSurfaceAdjusted = ensureContrast(onSurface, worstCaseBackground, 7.0, 0)

  // on-surface-variant: Secondary text — AA 4.5:1 against worst-case background
  const onSurfaceVariant = primary.clone()
  onSurfaceVariant.oklch.c = 0.01
  const onSurfaceVariantAdjusted = findOptimalLightness(onSurfaceVariant, worstCaseBackground, 4.5)

  return {
    surface,
    onSurface: onSurfaceAdjusted,
    onSurfaceVariant: onSurfaceVariantAdjusted,
    container,
    containerSunken,
    containerOverlay,
  }
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
export function makeContainerForAccent(accent: Color, isDarkMode: boolean): { container: Color; onContainer: Color } {
  const accentC = accent.oklch.c ?? 0

  const container = accent.clone()
  container.oklch.l = isDarkMode ? 0.3 : 0.9
  container.oklch.c = Math.min(accentC * 0.4, 0.1)

  const onContainerBase = container.clone()
  onContainerBase.oklch.c = Math.min(accentC * 0.7, 0.16)
  const onContainer = getAccessibleVariant(onContainerBase, container, 4.5)

  return { container, onContainer }
}
