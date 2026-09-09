import Color from 'colorjs.io'
import { clampOKLCH, DisplayGamut } from '../utils'

// ===== PALETTE POLISH =====
//
// An optional, single-pass aesthetic finish applied to each *derived* swatch after the geometry
// from schemes.ts (never to the base swatch). These are the touches the old enhancer.ts performed,
// but merged into ONE well-defined pass instead of three stages that fought each other. Every rule
// is gated so it only fires where it helps and leaves intentional choices alone (genuine neutrals
// keep zero chroma; clearly-saturated colors skip the muddy rule; etc.).
//
// To retune: edit POLISH. To ship raw geometry with no finish: set `enabled: false`.

export interface PolishConfig {
  enabled: boolean
  /**
   * Resolve the "muddy" dead band — a mid-lightness swatch carrying just enough chroma to read as
   * a failed color (neither a clean neutral nor a clean hue). Commit it to a cleaner color, hue
   * preserved. Near-neutral and clearly-saturated swatches fall outside the band and pass through.
   */
  muddy: { anchorL: number; anchorC: number; anchorH: number; radius: number; hueSpan: number; boost: number; cap: number }
  /** Enrich very dark swatches so they read rich, not flat; the very deepest lean slightly cool. */
  dark: {
    lMax: number
    boost: number
    cap: number
    coolLMax: number
    coolHue: number
    coolAmount: number
  }
  /** Jewel tone: let saturated mid-tones sing — a hair darker, a hair more chroma. */
  jewel: { cMin: number; lLo: number; lHi: number; lMul: number; cMul: number }
  /** Floor the chroma of very light swatches so they keep a tint instead of washing to white. */
  lightTint: { lMin: number; cMax: number; floor: number }
}

export const POLISH: PolishConfig = {
  enabled: true,
  // Anchored on the measured locus of "mud" rather than a broad box. Ou & Luo's colour-activity
  // minimum and the least-preferred region in Palmer & Schloss's ecological-valence work both sit
  // at CIELAB (50,3,17) = OKLCH(0.568, 0.043, 81deg) — an olive/khaki. The old box rule fired 146
  // times per 800 swatches when only 18 were actually near that anchor, and 88 of those firings
  // were at hue 150-329, i.e. it was saturating the dove-slate blues that make Nordic and
  // Japanese palettes work. It also often did nothing: c * 1.7 only escapes the band at all if
  // c > 0.053, so 45 firings were no-ops.
  muddy: { anchorL: 0.568, anchorC: 0.043, anchorH: 81, radius: 0.075, hueSpan: 55, boost: 2.2, cap: 0.13 },
  // coolAmount is 0: the "rich black leans cool" rotation was gated on a lightness that is
  // itself style-dependent (lSpread), so the same slot came out with a different HUE per style —
  // up to 17.8 degrees, and style must never move hue. The chromatic-shadow intent it encoded is
  // now expressed directly as the hue offset on each scheme's dark-anchor slot in schemes.ts,
  // where it is style-invariant by construction.
  dark: { lMax: 0.25, boost: 1.3, cap: 0.15, coolLMax: 0.15, coolHue: 264, coolAmount: 0 },
  jewel: { cMin: 0.15, lLo: 0.35, lHi: 0.65, lMul: 0.97, cMul: 1.08 },
  lightTint: { lMin: 0.85, cMax: 0.04, floor: 0.04 },
}

/**
 * Apply the polish pass to one derived swatch, then re-clamp into the display gamut so the result
 * stays realizable. Genuine neutrals (no hue / ~0 chroma) are returned untouched — polish never
 * injects a hue into a color that doesn't have one.
 */
export function polishSwatch(color: Color, gamut: DisplayGamut, cfg: PolishConfig = POLISH): Color {
  if (!cfg.enabled) return color

  let l = color.oklch.l ?? 0.5
  let c = color.oklch.c ?? 0
  let h = color.oklch.h ?? NaN

  if (!Number.isFinite(h) || c < 0.01) return color

  // 1. Muddy band → commit to a cleaner color (hue held).
  const m = cfg.muddy
  const hueFromMud = Math.abs((((h - m.anchorH + 540) % 360) - 180))
  const distFromMud = Math.hypot(l - m.anchorL, c - m.anchorC)
  if (hueFromMud <= m.hueSpan && distFromMud <= m.radius) {
    // Guarantee the escape: a multiplier alone leaves near-neutral swatches inside the band.
    c = Math.min(Math.max(c * m.boost, m.anchorC + m.radius + 0.01), m.cap)
  }

  // 2. Enrich darks; the deepest lean slightly cool (the "rich black" move) via shortest hue path.
  const d = cfg.dark
  if (l < d.lMax) {
    c = Math.min(c * d.boost, d.cap)
    if (l < d.coolLMax) {
      const diff = ((d.coolHue - h + 540) % 360) - 180
      h = (((h + diff * d.coolAmount) % 360) + 360) % 360
    }
  }

  // 3. Jewel tone for saturated mid-tones.
  const j = cfg.jewel
  if (c > j.cMin && l > j.lLo && l < j.lHi) {
    l = l * j.lMul
    c = c * j.cMul
  }

  // 4. Light-tint floor.
  const lt = cfg.lightTint
  if (l > lt.lMin && c < lt.cMax) {
    c = Math.max(c, lt.floor)
  }

  const v = clampOKLCH(l, c, h, gamut)
  const out = color.clone()
  out.oklch.l = v.l
  out.oklch.c = v.c
  out.oklch.h = v.h
  return out
}
