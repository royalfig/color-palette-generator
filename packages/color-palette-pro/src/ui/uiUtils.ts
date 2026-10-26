import Color from 'colorjs.io'
import { ColorFormat, PaletteStyle, SurfaceTreatment } from '../types/types'
import type { DisplayGamut } from '../utils'
import { clampChromaToGamut, findOptimalLightness, maxChromaFor, realizedContrast } from './colorMath'
import { cvdDistance } from './cvd'
import { SURFACE_TREATMENT, DEFAULT_TREATMENT } from './uiConst'

/**
 * Searches outward from a preferred lightness until the contrast ratio is met.
 * Use this when you want to stay as close to a target tone as possible
 * (e.g. brand primary at Tone 40), rather than the minimum-satisfying L.
 *
 * With a `gamut`, each candidate is realized in it (chroma clamped at the candidate L) and must
 * pass via `realizedContrast`. Without one, the raw coords are measured — the semantic colours
 * still rely on that, as their chroma-retention check reads the unclamped chroma back.
 */
export function findLightnessFromTarget(
  baseColor: Color,
  background: Color,
  minRatio: number,
  preferredL: number,
  gamut?: DisplayGamut,
): Color {
  const backgroundL = background.oklch.l ?? 0.5
  const direction = backgroundL < 0.5 ? 1 : -1 // dark bg → go lighter; light bg → go darker
  const result = baseColor.clone()

  for (let step = 0; step <= 100; step++) {
    const testL = preferredL + direction * step * 0.01
    if (testL < 0 || testL > 1) break
    result.oklch.l = testL
    if (gamut) {
      const realized = clampChromaToGamut(result, gamut)
      if (realizedContrast(realized, background, gamut) >= minRatio) return realized
    } else if (result.contrastWCAG21(background) >= minRatio) return result
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
  gamut: DisplayGamut = 'srgb',
): Color {
  // Candidate on-color at lightness `l`, keeping a scaled chroma floor so the on-color stays
  // faintly tinted where lightness allows (chroma is barely perceptible at the poles, and the
  // gamut ceiling there is tiny, so the floor is damped toward 0 as l approaches 0 or 1).
  const at = (l: number): Color => {
    const t = color.clone()
    t.oklch.l = l
    const effectiveFloor = chromaFloor * Math.max(0, 1 - Math.abs(l - 0.5) * 2)
    t.oklch.c = Math.max(t.oklch.c ?? 0, effectiveFloor)
    // Near the poles the primary's own chroma is far out of gamut, and the clipped result is
    // what both the side choice and the pass check below would measure. Unclamped, a tinted
    // L 0.98 clipped to a yellowish light that lost to black for an amber primary, and the
    // neutral-white candidate that would have passed was never tried.
    return clampChromaToGamut(t, gamut)
  }

  // Which pole to head for. This used to be decided by `backgroundL < 0.5` in OKLCH, but the
  // WCAG luminance crossover does not sit at OKLCH L 0.5 — for a chromatic mid-tone it is nearer
  // L 0.62. A primary at L 0.513 was therefore given dark text at 3.58:1 when light text would
  // have given 5.70:1. Ask which side actually has more contrast instead of assuming.
  // Contrast is judged on the 8-bit hex the token will actually ship as. Measuring the float
  // lets a candidate pass at 4.50 and ship at 4.33 once quantized.
  const q = (c: Color): Color => new Color(c.to('srgb').toString({ format: 'hex' }))
  // In a wide gamut the wide value must pass as well; the hex above is only its fallback.
  const bgQ = q(background)
  const contrast = (c: Color): number => {
    const shipped = q(c).contrastWCAG21(bgQ)
    return gamut === 'srgb' ? shipped : Math.min(shipped, realizedContrast(c, background, gamut))
  }

  const darkSideBetter = contrast(at(0.02)) > contrast(at(0.98))
  // Comfortable tone first (a cleaner on-color), then the extreme, then the other side.
  const order = darkSideBetter ? [0.12, 0.02, 0.9, 0.98] : [0.9, 0.98, 0.12, 0.02]
  for (const l of order) {
    const candidate = at(l)
    if (contrast(candidate) >= minRatio) return candidate
  }

  // Both poles fall short with the tint on. Chroma costs contrast, so shed it before giving up.
  const bestL = darkSideBetter ? 0.02 : 0.98
  for (const scale of [0.6, 0.3, 0]) {
    const candidate = at(bestL)
    candidate.oklch.c = (candidate.oklch.c ?? 0) * scale
    if (contrast(candidate) >= minRatio) return candidate
  }
  // Then the true poles, both sides. Pure white or black clears ~4.58:1 against ANY colour (the
  // worst case is a background at the white/black luminance crossover), but L 0.02/0.98 does not:
  // #e11d48's primary sits on that crossover and was handed a 4.46:1 on-colour. at() drops the
  // chroma to zero there, since nothing else is in gamut.
  for (const l of darkSideBetter ? [0, 1] : [1, 0]) {
    const pole = at(l)
    if (contrast(pole) >= minRatio) return pole
  }
  return findOptimalLightness(at(bestL), background, minRatio)
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
 * Lightness that yields `targetRatio` WCAG contrast against `surface`, searching away from the
 * surface (upward in dark mode, downward in light). Contrast is monotone in that direction, so a
 * bisection converges. Returns the closest achievable L if the ratio is out of reach.
 */
function findLightnessForContrast(
  color: Color,
  surface: Color,
  targetRatio: number,
  isDarkMode: boolean,
  gamut: DisplayGamut,
): number {
  const at = (l: number): number => {
    const c = color.clone()
    c.oklch.l = l
    // Measure what will render: the caller may hand in a chroma that is only reachable at some
    // lightnesses, and WCAG luminance of out-of-gamut coords is not the displayed value.
    return realizedContrast(c, surface, gamut)
  }
  // `lo` is the failing end (at the surface), `hi` the passing extreme. Converge on the least
  // extreme lightness that still passes, i.e. the one closest to the surface.
  let lo = surface.oklch.l ?? 0.5
  let hi = isDarkMode ? 1 : 0
  if (at(hi) < targetRatio) return hi // ratio unreachable — take the most contrast available
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (at(mid) >= targetRatio) hi = mid
    else lo = mid
  }
  return hi
}

/**
 * A seed the target gamut can actually express, without throwing away its hue.
 *
 * Preserving the seed's lightness is the whole point of adaptPrimaryForMode, but lightness and
 * chroma are not independent: at L 1.0 the only in-gamut colour is white, so honouring the
 * lightness of `oklch(100% 0.4 120)` would return #ffffff and lose the hue entirely. Where the
 * requested chroma is unreachable at the requested lightness, move L toward the hue's cusp — the
 * least-destructive trade, since hue is the part of a brand colour people actually recognise.
 *
 * "Unreachable" means the in-place clamp would leave the colour close to neutral, not merely less
 * saturated than asked. The bar used to be half the requested chroma, which also fired for
 * ordinary mid-lightness seeds: `oklch(56% 0.28 66)` clamps in place to a clearly amber C 0.125,
 * yet was moved to L 0.63 for C 0.14 — costing the seed its lightness, and with it the light-mode
 * contrast it had. Holding L and H and reducing only C is the closest in-gamut colour (it is what
 * CSS Color 4 gamut mapping does), so L moves only as far as needed to reach the floor.
 */
const MIN_REALIZABLE_CHROMA = 0.04
function realizableSeed(primary: Color, gamut: DisplayGamut): Color {
  const c = primary.oklch.c ?? 0
  const h = primary.oklch.h ?? NaN
  const l = primary.oklch.l ?? 0.5
  if (c <= 0.02 || !Number.isFinite(h)) return clampChromaToGamut(primary, gamut)
  const needed = Math.min(c * 0.5, MIN_REALIZABLE_CHROMA)
  if (maxChromaFor(l, h, gamut) >= needed) return clampChromaToGamut(primary, gamut)

  let bestL = l
  let bestCap = maxChromaFor(l, h, gamut)
  for (let step = 0.01; step <= 0.7; step += 0.01) {
    for (const cand of [l - step, l + step]) {
      if (cand < 0.05 || cand > 0.97) continue
      const cap = maxChromaFor(cand, h, gamut)
      if (cap > bestCap) {
        bestCap = cap
        bestL = cand
      }
      if (cap >= needed) {
        const hit = primary.clone()
        hit.oklch.l = cand
        return clampChromaToGamut(hit, gamut)
      }
    }
  }
  const out = primary.clone()
  out.oklch.l = bestL
  return clampChromaToGamut(out, gamut)
}

/**
 * Adapt the seed into a usable `primary` for one mode.
 *
 * The seed's LIGHTNESS IS PRESERVED whenever it already clears 4.5:1 against that mode's surface.
 * This used to overwrite lightness unconditionally with a fixed tonal target (OKLCH L 0.80 dark /
 * 0.40 light, M3-inspired), so `primary` was never the colour the user asked for — even a
 * perfectly in-gamut #3b82f6 (L 0.623) came back at L 0.794 in dark and L 0.354 in light.
 *
 * For the mode where the seed does NOT work, it is re-placed at the lightness that reproduces the
 * SAME CONTRAST RATIO it had in its native mode. That keeps the light/dark pair feeling like one
 * colour adapted, rather than two unrelated tones.
 *
 * Note why this is equal *contrast* and not an equal lightness delta from each extreme, which is
 * the intuitive version: the two surfaces are not symmetric. The dark surface sits at L 0.187,
 * a long way from black, while the light surface at L 0.984 is a hair from white — so dark mode
 * has much less headroom and its 4.5:1 threshold runs higher (L 0.56-0.63 by hue) than light's
 * (0.52-0.58). Measured over a hue/chroma grid, mirroring L about 0.5 carries a dark-passing seed
 * into light 100% of the time but a light-passing seed into dark only 72% of the time. Matching
 * the contrast ratio instead is hue- and chroma-aware and cannot fail by construction.
 *
 * `targetL` (used by callers that need an explicit tone) still overrides everything.
 *
 * `gamut` is where the primary is realized. Outside sRGB it keeps the extra chroma a wide-gamut
 * screen can show, and every contrast check requires both the wide value and its sRGB fallback
 * to pass (`realizedContrast`). The `targetL` path does not take a gamut and stays as it was.
 */
export function adaptPrimaryForMode(
  primary: Color,
  isDarkMode: boolean,
  targetL?: number,
  actualSurface?: Color,
  gamut: DisplayGamut = 'srgb',
): Color {
  const surfaceAt = (l: number): Color => {
    const s = primary.clone()
    s.oklch.l = l
    s.oklch.c = 0
    return s
  }
  // Proxies for the two mode surfaces, tracking generateSurfaceColors' baseSurfaceL anchors.
  // Callers that have already built the real surface stack should pass `actualSurface`: the
  // per-style material treatment moves the surface a long way from the anchor (diamond's light
  // surface is L 0.947, not 0.984), and verifying against the anchor instead of the real ground
  // left ~10% of primaries below 4.5:1 against the surface they actually sit on.
  const darkSurface = isDarkMode && actualSurface ? actualSurface : surfaceAt(0.187)
  const lightSurface = !isDarkMode && actualSurface ? actualSurface : surfaceAt(0.984)
  const surface = isDarkMode ? darkSurface : lightSurface

  if (targetL !== undefined) {
    const target = primary.clone()
    target.oklch.l = targetL
    if (target.contrastWCAG21(surface) >= 4.5) return target
    return findLightnessFromTarget(target, surface, 4.5, targetL)
  }

  // Verified with a margin over 4.5. Everything is serialized to 8-bit hex downstream, and that
  // quantization costs up to ~0.2 of a contrast ratio — a seed sitting exactly on 4.5 (e.g.
  // #e11d48 at 4.49) would otherwise ship at 4.31 once rounded.
  const PASS = 4.62
  const seed = realizableSeed(primary, gamut)
  const seedInDark = realizedContrast(seed, darkSurface, gamut)
  const seedInLight = realizedContrast(seed, lightSurface, gamut)
  const passesDark = seedInDark >= PASS
  const passesLight = seedInLight >= PASS

  // The seed already works here: hand it back untouched.
  if ((isDarkMode && passesDark) || (!isDarkMode && passesLight)) return seed.clone()

  // It works in the OTHER mode: reproduce that same contrast on this side.
  // Capped at AAA: a seed near one pole (L 0.1, or #fefefe) has ~17:1 in its native mode, and
  // matching that on the other side lands on the opposite pole and drops all its chroma.
  const MAX_MATCHED_RATIO = 7
  const nativeRatio = isDarkMode ? seedInLight : seedInDark
  const ratio = passesDark || passesLight ? Math.min(MAX_MATCHED_RATIO, Math.max(PASS, nativeRatio)) : PASS

  // Carry the chroma the user ASKED for, not the seed's clamped chroma: an out-of-gamut dark seed
  // (oklch(27% 0.28 120)) realizes only C 0.064 at its own lightness, but its other-mode tone
  // near L 0.7 has room for twice that, and inheriting the clamp left it needlessly dull.
  const requested = seed.clone()
  requested.oklch.c = Math.max(seed.oklch.c ?? 0, primary.oklch.c ?? 0)
  const out = requested.clone()
  out.oklch.l = findLightnessForContrast(requested, surface, ratio, isDarkMode, gamut)
  return clampChromaToGamut(out, gamut)
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
  chromaRetention = 0.75,
): { error: Color; warning: Color; success: Color } {
  // Lightness range we may explore (kept inside legible bounds). The contrast filter below
  // further restricts this per-color so every result still clears 4.5:1 against the surface.
  const candidateLs: number[] = []
  for (let l = 0.18; l <= 0.96; l += 0.02) candidateLs.push(l)

  // Matches the fill rule in semantic.ts (WCAG 1.4.11). At 4.5 this filter removed every
  // chromatic candidate for amber on a light surface, so the search could only pick near-black.
  // A candidate also qualifies if it keeps the role's colour identity — see semantic.ts.
  const contrastOk = (c: Color, original: Color): boolean => {
    if (!surface) return true
    if (c.contrastWCAG21(surface) >= 3) return true
    return (c.oklch.c ?? 0) / Math.max(1e-6, original.oklch.c ?? 1e-6) >= chromaRetention
  }

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
      if (!contrastOk(probe, c)) continue
      let minD = Infinity
      for (const p of placed) minD = Math.min(minD, cvdDistance(probe, p))
      // Reward distinctness; gently prefer staying near the role's natural lightness so amber
      // stays light, error stays deep, etc. The bonus is dwarfed once a pair is below minDist.
      // The distance term was weighted x10 against an |dL| penalty that could never exceed ~0.78,
      // so the search always ran to the far edge of the band: light-mode warning shipped as
      // #3B2400 and success as #00240F, near-black, with chroma halved by gamut clipping — and
      // it still failed (protan error-vs-warning ran below the target in most themes). Weighting
      // the lightness penalty properly keeps each role near its natural value.
      const chromaKept = (probe.oklch.c ?? 0) / Math.max(1e-6, c.oklch.c ?? 1e-6)
      const score = Math.min(minD, minDist) - Math.abs(l - targetL) * 8 + chromaKept * 2
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
