import type { PaletteStyle } from "../types/types";
import { ANSI_C_BAND, ANSI_C_CEILING, SHAPE_INTENSITY } from "./constants";

/**
 * Seed-driven palette intensity (audit note 3). The base color's chroma — not the palette
 * kind — picks how saturated the ANSI core and the Aurora semantics run. A gentle remap drops
 * the seed's chroma into [ANSI_C_BAND] (never a multiply: a near-gray seed still yields
 * colored-but-muted slots, a neon seed punchy ones, and the band protects both extremes).
 * Shape modulates that anchor — square calmer, diamond punchier, clamped to ANSI_C_CEILING —
 * so it's a modifier on the level rather than the parallel knob that used to let Triangle
 * out-saturate Diamond. Surfaces and the selection container already track the seed's chroma
 * in ui.ts; this puts the ANSI core and the semantics on the same scalar. Mode-independent.
 */
export function intensityChromaFor(
  seedChroma: number,
  style: PaletteStyle,
): number {
  const t = Math.max(0, Math.min(1, Math.pow(seedChroma / 0.22, 0.85)));
  return Math.min(
    ANSI_C_CEILING,
    (ANSI_C_BAND[0] + (ANSI_C_BAND[1] - ANSI_C_BAND[0]) * t) *
      SHAPE_INTENSITY[style],
  );
}
