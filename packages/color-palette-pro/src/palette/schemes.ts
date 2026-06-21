import { PaletteKinds, PaletteStyle } from "../types/types";

// ===== DECLARATIVE PALETTE SCHEMES =====
//
// The whole palette geometry now lives here as data. A palette is `base color × scheme × style`:
//
//   • SCHEME defines the geometry + per-slot role intent — a list of slots, each a delta from the
//     base color: hue offset (deg), lightness delta, chroma multiplier. Slot 0 is always the base
//     itself (preserved exactly). This is the only place the "what hues, how light, how saturated"
//     decision is expressed — no hidden enhancer/narrative/polish stages on top.
//
//   • STYLE is a shaping dial applied uniformly to every scheme: how far the lightness spreads and
//     how hard the chroma contrast runs. STYLE is *material only* — it never touches hue, so the
//     scheme's geometry (and therefore the palette's hues) is identical across all four styles.
//
// `generate.ts` reads these tables in one `deriveSwatch()` pass. To retune a palette you edit the
// numbers here — nothing else.

/** One output slot, expressed relative to the base color. */
export interface SlotSpec {
  /** Degrees from the base hue (the scheme's geometry). */
  hueOffset: number;
  /** Lightness delta from the base L (before the style's spread is applied). */
  dL: number;
  /** Multiplier on the base chroma (1 = same saturation as the base). */
  cMul: number;
}

/**
 * Per-scheme slots (6 each). Slot order is load-bearing: `ui/accentColors.ts` and
 * `code-mode` select secondary/tertiary accents by index, so the role of each slot
 * must stay put (see the comments). Slot 0 is the base color.
 */
export const SCHEME_SLOTS: Record<Exclude<PaletteKinds, "tas">, SlotSpec[]> = {
  // Analogous — a 60° fan around the base, fanning lighter as it opens.
  ana: [
    { hueOffset: 0, dL: 0, cMul: 1.0 }, // base
    { hueOffset: -30, dL: -0.2, cMul: 0.8 },
    { hueOffset: -20, dL: -0.1, cMul: 0.9 }, // secondary
    { hueOffset: -10, dL: 0.15, cMul: 0.85 },
    { hueOffset: 15, dL: 0.25, cMul: 0.7 },
    { hueOffset: 30, dL: 0.35, cMul: 0.6 }, // tertiary
  ],
  // Complementary — base family + the 180° opposite, each with a light + muted variant.
  com: [
    { hueOffset: 0, dL: 0, cMul: 1.0 }, // base
    { hueOffset: 180, dL: 0.05, cMul: 0.9 }, // main complement (tertiary)
    { hueOffset: 0, dL: -0.2, cMul: 1.1 }, // dark base
    { hueOffset: 0, dL: 0.2, cMul: 0.8 }, // light base
    { hueOffset: 180, dL: 0.25, cMul: 0.7 }, // light complement
    { hueOffset: 180, dL: -0.15, cMul: 0.5 }, // muted complement (secondary)
  ],
  // Triadic — base + two 120° hues, each accent hue with a pure + muted variant.
  tri: [
    { hueOffset: 0, dL: 0, cMul: 1.0 }, // base
    { hueOffset: 0, dL: -0.2, cMul: 1.1 }, // dark base
    { hueOffset: 120, dL: 0.1, cMul: 0.95 }, // triad 1 pure
    { hueOffset: 120, dL: 0.2, cMul: 0.7 }, // triad 1 muted (secondary)
    { hueOffset: 240, dL: -0.1, cMul: 0.95 }, // triad 2 pure (tertiary)
    { hueOffset: 240, dL: -0.2, cMul: 0.7 }, // triad 2 muted
  ],
  // Tetradic — base + 90/180/270, weighted toward the base and its complement.
  tet: [
    { hueOffset: 0, dL: 0, cMul: 1.0 }, // base
    { hueOffset: 90, dL: 0.1, cMul: 0.9 }, // hue 2 pure
    { hueOffset: 90, dL: -0.15, cMul: 0.6 }, // hue 2 muted
    { hueOffset: 180, dL: 0.05, cMul: 0.95 }, // complement (secondary)
    { hueOffset: 270, dL: 0.2, cMul: 0.8 }, // hue 4 light (tertiary)
    { hueOffset: 270, dL: -0.25, cMul: 1.1 }, // hue 4 dark
  ],
  // Split-complementary — base + the two hues flanking the complement (±30°).
  spl: [
    { hueOffset: 0, dL: 0, cMul: 1.0 }, // base
    { hueOffset: 0, dL: -0.2, cMul: 1.1 }, // dark base
    { hueOffset: 150, dL: 0.1, cMul: 0.95 }, // split 1 pure
    { hueOffset: 150, dL: 0.2, cMul: 0.7 }, // split 1 muted (secondary)
    { hueOffset: 210, dL: -0.1, cMul: 0.95 }, // split 2 pure (tertiary)
    { hueOffset: 210, dL: 0.05, cMul: 0.6 }, // split 2 muted
  ],
};

/**
 * A style is a uniform shaping of any scheme's baseline slots. Material only: it shapes lightness
 * and chroma but never hue — the scheme owns the geometry, so a palette's hues are style-invariant.
 */
export interface StyleShape {
  /** Scales each slot's lightness delta — the drama of the light/dark spread. */
  lSpread: number;
  /** Scales each slot's chroma deviation from the base (>1 = more pop + more mute). */
  cContrast: number;
}

export const STYLE_SHAPES: Record<PaletteStyle, StyleShape> = {
  // Square — the textbook baseline: even spread, full saturation.
  square: { lSpread: 1.0, cContrast: 1.0 },
  // Triangle — perceptual restraint: gentler lightness, slightly calmer chroma.
  triangle: { lSpread: 0.85, cContrast: 0.9 },
  // Circle — expressive: a wider lightness journey with a stronger chroma crescendo.
  circle: { lSpread: 1.2, cContrast: 1.25 },
  // Diamond — luminosity-led: the most dramatic lightness range.
  diamond: { lSpread: 1.45, cContrast: 1.15 },
};
