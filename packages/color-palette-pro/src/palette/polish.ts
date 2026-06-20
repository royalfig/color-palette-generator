import Color from "colorjs.io";
import { clampOKLCH, DisplayGamut } from "../utils";

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
  enabled: boolean;
  /**
   * Resolve the "muddy" dead band — a mid-lightness swatch carrying just enough chroma to read as
   * a failed color (neither a clean neutral nor a clean hue). Commit it to a cleaner color, hue
   * preserved. Near-neutral and clearly-saturated swatches fall outside the band and pass through.
   */
  muddy: { lLo: number; lHi: number; cLo: number; cHi: number; boost: number; cap: number };
  /** Enrich very dark swatches so they read rich, not flat; the very deepest lean slightly cool. */
  dark: {
    lMax: number;
    boost: number;
    cap: number;
    coolLMax: number;
    coolHue: number;
    coolAmount: number;
  };
  /** Jewel tone: let saturated mid-tones sing — a hair darker, a hair more chroma. */
  jewel: { cMin: number; lLo: number; lHi: number; lMul: number; cMul: number };
  /** Floor the chroma of very light swatches so they keep a tint instead of washing to white. */
  lightTint: { lMin: number; cMax: number; floor: number };
}

export const POLISH: PolishConfig = {
  enabled: true,
  muddy: { lLo: 0.3, lHi: 0.72, cLo: 0.03, cHi: 0.09, boost: 1.7, cap: 0.13 },
  dark: { lMax: 0.25, boost: 1.3, cap: 0.15, coolLMax: 0.15, coolHue: 264, coolAmount: 0.08 },
  jewel: { cMin: 0.15, lLo: 0.35, lHi: 0.65, lMul: 0.97, cMul: 1.08 },
  lightTint: { lMin: 0.85, cMax: 0.04, floor: 0.04 },
};

/**
 * Apply the polish pass to one derived swatch, then re-clamp into the display gamut so the result
 * stays realizable. Genuine neutrals (no hue / ~0 chroma) are returned untouched — polish never
 * injects a hue into a color that doesn't have one.
 */
export function polishSwatch(
  color: Color,
  gamut: DisplayGamut,
  cfg: PolishConfig = POLISH,
): Color {
  if (!cfg.enabled) return color;

  let l = color.oklch.l ?? 0.5;
  let c = color.oklch.c ?? 0;
  let h = color.oklch.h ?? NaN;

  if (!Number.isFinite(h) || c < 0.01) return color;

  // 1. Muddy band → commit to a cleaner color (hue held).
  const m = cfg.muddy;
  if (l > m.lLo && l < m.lHi && c > m.cLo && c < m.cHi) {
    c = Math.min(c * m.boost, m.cap);
  }

  // 2. Enrich darks; the deepest lean slightly cool (the "rich black" move) via shortest hue path.
  const d = cfg.dark;
  if (l < d.lMax) {
    c = Math.min(c * d.boost, d.cap);
    if (l < d.coolLMax) {
      const diff = ((d.coolHue - h + 540) % 360) - 180;
      h = (((h + diff * d.coolAmount) % 360) + 360) % 360;
    }
  }

  // 3. Jewel tone for saturated mid-tones.
  const j = cfg.jewel;
  if (c > j.cMin && l > j.lLo && l < j.lHi) {
    l = l * j.lMul;
    c = c * j.cMul;
  }

  // 4. Light-tint floor.
  const lt = cfg.lightTint;
  if (l > lt.lMin && c < lt.cMax) {
    c = Math.max(c, lt.floor);
  }

  const v = clampOKLCH(l, c, h, gamut);
  const out = color.clone();
  out.oklch.l = v.l;
  out.oklch.c = v.c;
  out.oklch.h = v.h;
  return out;
}
