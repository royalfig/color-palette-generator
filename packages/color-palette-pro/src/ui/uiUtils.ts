import Color from 'colorjs.io'
import { ColorFormat, PaletteStyle, SurfaceTreatment } from '../types/types'
import { findOptimalLightness } from './colorMath'
import { cvdDistance } from './cvd'
import { SURFACE_TREATMENT, DEFAULT_TREATMENT } from './uiConst'

/**
 * Searches outward from a preferred lightness until the contrast ratio is met.
 * Use this when you want to stay as close to a target tone as possible
 * (e.g. brand primary at Tone 40), rather than the minimum-satisfying L.
 */
export function findLightnessFromTarget(
  baseColor: Color,
  background: Color,
  minRatio: number,
  preferredL: number,
): Color {
  const backgroundL = background.oklch.l ?? 0.5
  const direction = backgroundL < 0.5 ? 1 : -1 // dark bg → go lighter; light bg → go darker
  const result = baseColor.clone()

  for (let step = 0; step <= 100; step++) {
    const testL = preferredL + direction * step * 0.01
    if (testL < 0 || testL > 1) break
    result.oklch.l = testL
    if (result.contrastWCAG21(background) >= minRatio) return result
  }

  result.oklch.l = direction === 1 ? 0.98 : 0.02
  return result
}

/**
 * Generates an accessible (4.5:1 or 7:1) version of a color to sit on a background.
 * It targets OKLCH L 0.90 (on dark) / 0.12 (on light) for a clean "on-color" look.
 *
 * `chromaFloor` is the minimum chroma the result carries — but it's scaled down as the target
 * lightness approaches the poles, because chroma is barely perceptible at L≈0.12/0.90 (and the
 * gamut ceiling there is tiny). The old code forced a flat 0.06 floor and claimed it kept
 * on-colors "visibly tinted"; at the poles it did almost nothing. Scaling keeps the promise
 * honest: a real tint where L allows it, near-neutral where it doesn't. (Audit 4E.)
 */
export function getAccessibleVariant(
  color: Color,
  background: Color,
  minRatio: number,
  chromaFloor: number = 0.06,
): Color {
  const backgroundL = background.oklch.l ?? 0.5
  const isDarkBg = backgroundL < 0.5
  const target = color.clone()

  // Target high-contrast levels (OKLCH L 0.90 on dark backgrounds, 0.12 on light)
  target.oklch.l = isDarkBg ? 0.9 : 0.12

  // Scale the floor by proximity to mid-lightness (≈0 at the poles, full near L 0.5).
  const effectiveFloor = chromaFloor * Math.max(0, 1 - Math.abs((target.oklch.l ?? 0.5) - 0.5) * 2)
  target.oklch.c = Math.max(target.oklch.c ?? 0, effectiveFloor)

  if (target.contrastWCAG21(background) >= minRatio) {
    return target
  }

  // If that's not enough contrast (extreme background), go to the poles
  target.oklch.l = isDarkBg ? 0.98 : 0.02
  if (target.contrastWCAG21(background) >= minRatio) {
    return target
  }

  // Absolute fallback: search for the limit (though Tone 0.02/0.98 should almost always work)
  return findOptimalLightness(target, background, minRatio)
}

export function ensureContrast(color: Color, background: Color, minRatio: number, chromaFloor: number = 0.06): Color {
  if (color.contrastWCAG21(background) >= minRatio) {
    return color.clone()
  }
  // If it's a UI element (3:1), we find the minimal shift.
  // If it's text (4.5:1), we use getAccessibleVariant for a cleaner look.
  if (minRatio >= 4.5) {
    return getAccessibleVariant(color, background, minRatio, chromaFloor)
  }
  return findOptimalLightness(color, background, minRatio)
}

// ===== PRIMARY COLOR ADAPTATION =====

/**
 * Ensures the primary color contrasts with the surface of the mode.
 * Light mode: Ensure primary is dark enough to sit on light surface.
 * Dark mode: Ensure primary is light enough to sit on dark surface.
 */
export function adaptPrimaryForMode(primary: Color, isDarkMode: boolean, targetL?: number): Color {
  const surfaceL = isDarkMode ? 0.12 : 0.98
  const surface = primary.clone()
  surface.oklch.l = surfaceL
  surface.oklch.c = 0

  // We use OKLCH L 0.40 (light) / 0.80 (dark) for the primary — M3-INSPIRED, but note these
  // are OKLCH lightness values, NOT M3 HCT "tones". HCT tone ≈ CIE L*, a different scale, so
  // OKLCH L 0.40 ≠ HCT tone 40. Don't cross-reference these against M3 reference palettes.
  // (Audit 4A.) Callers may override (naturally-light + light mode prefers L=0.35).
  const desiredL = targetL ?? (isDarkMode ? 0.8 : 0.4)
  const target = primary.clone()
  target.oklch.l = desiredL

  if (target.contrastWCAG21(surface) >= 4.5) {
    return target
  }

  // Search outward from the desired tone instead of converging on the minimum
  // (which would collapse the primary toward the surface lightness).
  return findLightnessFromTarget(target, surface, 4.5, desiredL)
}

/**
 * Chroma for a tinted-neutral surface, damped toward 0 as the surface approaches the mode's
 * "paper" extreme (white in light mode, black in dark). Near those extremes even a tiny OKLCH
 * chroma reads as heavily saturated (HSL saturation blows up as L→1, and a faint wash on a
 * near-white page is conspicuous), so the page canvas and floating overlays trend neutral while
 * mid-elevation containers — further from the extreme — may carry a whisper of brand tint.
 *
 * `intended` is the chroma we'd use mid-range; `proximityRange` is how far from the extreme the
 * tint ramps back to full. (Audit 4B.)
 */
export function dampedSurfaceChroma(
  primaryC: number,
  l: number,
  isDarkMode: boolean,
  intended: number,
  minProximity = 0,
): number {
  // HSL saturation (and perceived "colored-ness" of a near-neutral fill) blows up as L
  // approaches EITHER extreme — its denominator 1−|2L−1| → 0 at both black and white. So damp
  // by distance from the nearer extreme: ~0 chroma near black/white, full at mid lightness.
  //
  // `minProximity` sets a floor on that damping per role: the page surface and floating overlay
  // use 0 (they trend fully neutral near white), but containers use a positive floor so they
  // keep a visible brand tint even when their lightness sits close to white. (Audit 4B.)
  const distanceFromExtreme = Math.min(l, 1 - l) // 0 at the poles, 0.5 at mid
  const proximity = Math.max(minProximity, Math.min(1, distanceFromExtreme / 0.5))
  return Math.min(primaryC, intended) * proximity
}

export function surfaceChromaFor(
  primary: Color,
  isDarkMode: boolean,
  treatment: SurfaceTreatment,
  surfaceL: number,
): number {
  const c = primary.oklch.c ?? 0
  // Page canvas: the most restrained tint of the whole stack. Damping is computed at the surface's
  // ACTUAL lightness (after any stack shift) so a diamond page pulled off pure white can hold its
  // tone, while a square page at L≈0.99/0.23 stays near-neutral. surfaceChromaScale dials it.
  return dampedSurfaceChroma(c, surfaceL, isDarkMode, 0.012 * treatment.surfaceChromaScale, treatment.minProximityBoost)
}

export function colorToCss(color: Color, format: ColorFormat): string {
  if (format === 'hex') return color.to('srgb').toString({ format: 'hex' })
  if (format === 'rgb' || format === 'srgb') return color.to('srgb').toString({ precision: 4 })
  return color.to(format).toString({ precision: 4 })
}

export function enforceCvdDistinctSemantics(
  error: Color,
  warning: Color,
  success: Color,
  surface: Color | undefined,
  minDist = 14,
): { error: Color; warning: Color; success: Color } {
  // Lightness range we may explore (kept inside legible bounds). The contrast filter below
  // further restricts this per-color so every result still clears 4.5:1 against the surface.
  const candidateLs: number[] = []
  for (let l = 0.18; l <= 0.96; l += 0.02) candidateLs.push(l)

  const contrastOk = (c: Color): boolean => !surface || c.contrastWCAG21(surface) >= 4.5

  // Place error first (anchor), then amber, then green — green is confusable with BOTH, so it
  // gets last pick of the remaining lightness space.
  const placed: Color[] = [error]
  const place = (c: Color) => {
    const targetL = c.oklch.l ?? 0.5
    let best = targetL
    let bestScore = -Infinity
    for (const l of candidateLs) {
      const probe = c.clone()
      probe.oklch.l = l
      if (!contrastOk(probe)) continue
      let minD = Infinity
      for (const p of placed) minD = Math.min(minD, cvdDistance(probe, p))
      // Reward distinctness; gently prefer staying near the role's natural lightness so amber
      // stays light, error stays deep, etc. The bonus is dwarfed once a pair is below minDist.
      const score = Math.min(minD, minDist) * 10 - Math.abs(l - targetL)
      if (score > bestScore) {
        bestScore = score
        best = l
      }
    }
    c.oklch.l = best
    placed.push(c)
  }
  place(warning)
  place(success)

  return { error, warning, success }
}

export function surfaceTreatmentFor(style?: PaletteStyle): SurfaceTreatment {
  return style ? (SURFACE_TREATMENT[style] ?? DEFAULT_TREATMENT) : DEFAULT_TREATMENT
}

// ===== ELEVATION SHADOWS =====

// Relative-color wrapper per output space. Each emits `<fn>(from var(--<token>) <channels> / a)`,
// which passes the source color's channels through unchanged and only overrides alpha — so
// `--shadow-color` / `--highlight-color` stay *real, reusable colors* (in the palette's own
// space) and every layer derives its translucency from them.
export const REL_WRAP: Record<ColorFormat, { fn: string; channels: string }> = {
  oklch: { fn: 'oklch', channels: 'l c h' },
  oklab: { fn: 'oklab', channels: 'l a b' },
  lab: { fn: 'lab', channels: 'l a b' },
  lch: { fn: 'lch', channels: 'l c h' },
  hsl: { fn: 'hsl', channels: 'h s l' },
  p3: { fn: 'color', channels: 'display-p3 r g b' },
  srgb: { fn: 'rgb', channels: 'r g b' },
  rgb: { fn: 'rgb', channels: 'r g b' },
  hex: { fn: 'rgb', channels: 'r g b' },
}
