import Color from 'colorjs.io'
import type { BaseColorData } from '../factory'
import { findColorByHue, getMedianChroma } from './colorMath'
import { enforceCvdDistinctSemantics, findLightnessFromTarget, getAccessibleVariant } from './uiUtils'

/** Aurora overrides (code-mode): pull functional colors to the kind's saturation + lean them
 *  toward the base family, so error/warning/success belong to the theme without losing their
 *  canonical meaning. Omitted by the UI palette, which keeps the fixed signal band. */
export interface SemanticAuroraOptions {
  /** Target chroma for all semantics (the kind's character centre), clamped to a signal-safe band. */
  chromaTarget?: number
  /** Hue of the base family; canonical semantic hues lean toward it by up to leanCap. */
  familyHue?: number
  /** Max degrees a semantic hue may lean toward familyHue (default 0 = no lean). */
  leanCap?: number
}

export function generateSemanticColors(
  primary: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  surface?: Color,
  options: SemanticAuroraOptions = {},
): {
  error: Color
  onError: Color
  success: Color
  onSuccess: Color
  warning: Color
  onWarning: Color
} {
  const medianChroma = getMedianChroma(palette)

  // Canonical semantic HUES are pinned (not borrowed from the palette): an "error" must read
  // as red, not as whatever palette swatch happened to fall within 30° of red. We only borrow
  // *chroma* from a nearby palette member so the semantics feel related to the brand, with a
  // floor so they stay saturated enough to signal. (Audit 2A.)
  const borrowChroma = (hue: number): number => {
    // Aurora: when a chroma target is supplied (code-mode), every semantic sits at the kind's
    // saturation (Nord-muted → Dracula-neon), clamped so even the muted kinds still signal.
    if (options.chromaTarget !== undefined) {
      return Math.min(Math.max(options.chromaTarget, 0.1), 0.19)
    }
    const match = findColorByHue(palette, hue, 25)
    const c = match?.oklch.c ?? medianChroma
    // Floor keeps semantics saturated enough to read AND to stay separable under CVD
    // (perceptual distance grows with chroma); ceiling keeps them from screaming.
    return Math.min(Math.max(c, 0.13), 0.18)
  }

  // Distinct lightness targets per role. Separating error/success/warning in LIGHTNESS — not
  // just hue — keeps them distinguishable for red-green color-vision deficiency, where the
  // hue channel that normally separates red from green collapses. (Audit 2B.1.) Amber sits
  // lighter because high-chroma yellow is only realizable at higher L.
  const targetL = isDarkMode
    ? { error: 0.66, warning: 0.9, success: 0.74 }
    : { error: 0.42, warning: 0.62, success: 0.5 }

  // Construct fresh from explicit OKLCH coords. Building via `primary.clone()` breaks for
  // achromatic seeds (NaN hue): assigning `.oklch.h` onto a chroma-0 color doesn't reliably
  // take, leaving the semantics neutral (and thus indistinguishable under CVD).
  // Aurora hue lean: nudge each canonical hue a bounded amount toward the base family so the
  // semantics feel related (Nord's aurora) without drifting far enough to lose their meaning.
  const leanHue = (canonical: number): number => {
    if (options.familyHue === undefined || !options.leanCap) return canonical
    const signed = ((options.familyHue - canonical + 540) % 360) - 180
    return (canonical + Math.max(-options.leanCap, Math.min(options.leanCap, signed)) + 360) % 360
  }

  const make = (hue: number, l: number): Color => new Color('oklch', [l, borrowChroma(hue), hue])

  // Success uses a teal-leaning green (162°) rather than a pure green (~145°). The blue-yellow
  // axis it gains is preserved under red-green CVD, so success stays distinct from both amber
  // (warning) and red (error) for deuteranopes/protanopes — pure green collapses onto amber.
  let error = make(leanHue(27), targetL.error)
  let warning = make(leanHue(83), targetL.warning)
  let success = make(leanHue(162), targetL.success)

  // Step the semantic L back toward the surface only as far as needed to keep 4.5:1 — preserves
  // the perceived hue while making inline use (text/icons on surface) safe. Done FIRST so the
  // CVD pass (below) can then separate them without re-colliding.
  const clampAgainstSurface = (c: Color): Color => {
    if (!surface) return c
    if (c.contrastWCAG21(surface) >= 4.5) return c
    return findLightnessFromTarget(c, surface, 4.5, c.oklch.l ?? 0.5)
  }

  error = clampAgainstSurface(error)
  warning = clampAgainstSurface(warning)
  success = clampAgainstSurface(success)

  // Separate the three in OKLCH lightness so they stay mutually distinct *as a red-green
  // dichromat sees them*. Each color is re-placed at the lightness — within its contrast-safe
  // band against the surface — that maximizes CVD distance from the colors already placed.
  // Green is placed last (it's the one most confusable with both red and amber).
  ;({ error, warning, success } = enforceCvdDistinctSemantics(error, warning, success, surface))

  const onError = getAccessibleVariant(error, error, 4.5)
  const onSuccess = getAccessibleVariant(success, success, 4.5)
  const onWarning = getAccessibleVariant(warning, warning, 4.5)

  return {
    error,
    onError,
    success,
    onSuccess,
    warning,
    onWarning,
  }
}
