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
  /** Same hue as `error`, driven to 4.5:1 text contrast against the surface. */
  errorText: Color
  success: Color
  onSuccess: Color
  successText: Color
  warning: Color
  onWarning: Color
  warningText: Color
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
    : { error: 0.55, warning: 0.78, success: 0.62 }

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

  // Step the semantic L back toward the surface only as far as needed to keep the FILL contrast
  // rule — 3:1, WCAG 1.4.11 non-text contrast, which is the rule that actually governs a solid
  // status swatch, badge or icon. Demanding 4.5:1 of the fill was the bug that made light-mode
  // warning mud: amber physically cannot hold 4.5:1 against a near-white surface and stay amber
  // (hue 83 first meets it at L 0.55, by which point it reads olive and its chroma has already
  // collapsed from 0.150 to 0.113). Every generated light theme shipped warning as one of two
  // near-black hexes, with zero influence from the seed. Radix ships amber9 at 1.58:1 for the
  // same reason and puts the accessible amber in a separate step — which is what the *Text
  // variants below now provide. Done FIRST so the CVD pass can separate without re-colliding.
  const FILL_MIN_CONTRAST = 3
  // ...but never at the cost of the colour's identity. Amber cannot reach 3:1 on a near-white
  // surface while staying amber, and a "warning" that reads olive has failed at its actual job.
  // So the clamp stops early if it would cost more than CHROMA_RETENTION of the hue's chroma —
  // the accessible version of the colour is the *Text variant, not the fill. (Radix makes the
  // same call: amber9 ships at 1.58:1.)
  const CHROMA_RETENTION = 0.75
  const clampAgainstSurface = (c: Color): Color => {
    if (!surface) return c
    if (c.contrastWCAG21(surface) >= FILL_MIN_CONTRAST) return c
    const stepped = findLightnessFromTarget(c, surface, FILL_MIN_CONTRAST, c.oklch.l ?? 0.5)
    const kept = (stepped.oklch.c ?? 0) / Math.max(1e-6, c.oklch.c ?? 1e-6)
    return kept >= CHROMA_RETENTION ? stepped : c
  }

  error = clampAgainstSurface(error)
  warning = clampAgainstSurface(warning)
  success = clampAgainstSurface(success)

  // Separate the three in OKLCH lightness so they stay mutually distinct *as a red-green
  // dichromat sees them*. Each color is re-placed at the lightness — within its contrast-safe
  // band against the surface — that maximizes CVD distance from the colors already placed.
  // Green is placed last (it's the one most confusable with both red and amber).
  ;({ error, warning, success } = enforceCvdDistinctSemantics(error, warning, success, surface, 14, CHROMA_RETENTION))

  const onError = getAccessibleVariant(error, error, 4.5)
  const onSuccess = getAccessibleVariant(success, success, 4.5)
  const onWarning = getAccessibleVariant(warning, warning, 4.5)

  // Text-tier variants. The fill above is tuned to LOOK like its role (amber reads amber); these
  // are the same hue driven to real text contrast against the surface, for inline diagnostic
  // text, log lines and icon labels. Splitting the two is what lets the fill stay chromatic.
  const asText = (c: Color): Color => {
    if (!surface) return c.clone()
    if (c.contrastWCAG21(surface) >= 4.5) return c.clone()
    return findLightnessFromTarget(c.clone(), surface, 4.5, c.oklch.l ?? 0.5)
  }
  const errorText = asText(error)
  const warningText = asText(warning)
  const successText = asText(success)

  return {
    error,
    onError,
    errorText,
    success,
    onSuccess,
    successText,
    warning,
    onWarning,
    warningText,
  }
}
