import { PaletteKinds, PaletteStyle } from '../types/types'

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
  hueOffset: number
  /**
   * ABSOLUTE target lightness for this slot (0-1), not a delta from the base. Slot 0 ignores it
   * and keeps the base's own lightness exactly.
   *
   * This used to be a delta (`dL`). A delta means the palette's value structure is decided by
   * wherever the seed happened to land: a light seed produced six light swatches, so 87 of 160
   * generated palettes had no swatch darker than L 0.35 and 92 had four or more members above
   * C 0.10. A palette needs a value structure — a dark anchor, a light, some quiet mid-tones —
   * to compose, and every canonical limited palette measured in OKLCH (Zorn, Bauhaus, Japanese
   * irogami, Nordic) has one. Absolute targets give each scheme an explicit budget of
   * 1 hero / 2 supports / 1 quiet / 2 anchors, and the seed keeps its exact slot-0 value and
   * still owns every hue in the palette.
   */
  aL: number
  /** Multiplier on the base chroma (1 = same saturation as the base). */
  cMul: number
}

/**
 * Per-scheme slots (6 each). Slot order is load-bearing: `ui/accentColors.ts` and
 * `code-mode` select secondary/tertiary accents by index, so the role of each slot
 * must stay put (see the comments). Slot 0 is the base color.
 */
export const SCHEME_SLOTS: Record<Exclude<PaletteKinds, 'tas'>, SlotSpec[]> = {
  // Analogous — a fan around the base with a full value ladder from deep anchor to pale tint.
  ana: [
    { hueOffset: 0, aL: 0, cMul: 1.0 }, // base (keeps the seed's own lightness)
    { hueOffset: -40, aL: 0.22, cMul: 0.55 }, // dark anchor (secondary)
    { hueOffset: -18, aL: 0.4, cMul: 1.05 }, // support
    { hueOffset: 12, aL: 0.62, cMul: 1.15 }, // hero
    { hueOffset: 28, aL: 0.8, cMul: 0.55 }, // light support
    { hueOffset: 50, aL: 0.93, cMul: 0.28 }, // pale tint (tertiary)
  ],
  // Complementary — base family + its opposite. 180 exactly is the least interesting
  // complementary; splitting a few degrees off it reads warmer and less mechanical.
  com: [
    { hueOffset: 0, aL: 0, cMul: 1.0 }, // base
    { hueOffset: 190, aL: 0.6, cMul: 1.05 }, // main complement (secondary)
    { hueOffset: 8, aL: 0.24, cMul: 0.6 }, // dark base anchor
    { hueOffset: -8, aL: 0.88, cMul: 0.35 }, // light base (tertiary)
    { hueOffset: 172, aL: 0.78, cMul: 0.55 }, // light complement
    { hueOffset: 185, aL: 0.42, cMul: 0.35 }, // muted complement
  ],
  // Triadic — base + two hues near 120/240, nudged toward the empirical preference plateau.
  tri: [
    { hueOffset: 0, aL: 0, cMul: 1.0 }, // base
    { hueOffset: 8, aL: 0.22, cMul: 0.55 }, // dark base anchor
    { hueOffset: 122, aL: 0.68, cMul: 1.05 }, // triad 1 pure
    { hueOffset: 112, aL: 0.88, cMul: 0.35 }, // triad 1 light (secondary)
    { hueOffset: 238, aL: 0.45, cMul: 1.0 }, // triad 2 pure (tertiary)
    { hueOffset: 248, aL: 0.3, cMul: 0.5 }, // triad 2 muted
  ],
  // Tetradic — four hues, weighted so only one or two carry real chroma at a time.
  tet: [
    { hueOffset: 0, aL: 0, cMul: 1.0 }, // base
    { hueOffset: 75, aL: 0.72, cMul: 0.95 }, // hue 2 pure
    { hueOffset: 82, aL: 0.24, cMul: 0.5 }, // hue 2 dark anchor (secondary)
    { hueOffset: 185, aL: 0.52, cMul: 1.05 }, // complement
    { hueOffset: 280, aL: 0.86, cMul: 0.4 }, // hue 4 light (tertiary)
    { hueOffset: 265, aL: 0.34, cMul: 0.7 }, // hue 4 deep
  ],
  // Split-complementary — the two hues flanking the complement, at the preference plateau.
  spl: [
    { hueOffset: 0, aL: 0, cMul: 1.0 }, // base
    { hueOffset: 6, aL: 0.22, cMul: 0.55 }, // dark base anchor
    { hueOffset: 162, aL: 0.66, cMul: 1.05 }, // split 1 pure (secondary)
    { hueOffset: 155, aL: 0.88, cMul: 0.32 }, // split 1 light
    { hueOffset: 205, aL: 0.44, cMul: 1.0 }, // split 2 pure (tertiary)
    { hueOffset: 212, aL: 0.8, cMul: 0.42 }, // split 2 light
  ],
}

/**
 * A style is a uniform shaping of any scheme's baseline slots. Material only: it shapes lightness
 * and chroma but never hue — the scheme owns the geometry, so a palette's hues are style-invariant.
 */
export interface StyleShape {
  /** Spreads the slots' lightness around the scheme's own mean — the light/dark drama. */
  lSpread: number
  /** Scales each slot's chroma deviation from the base (>1 = more pop + more mute). */
  cContrast: number
}

export const STYLE_SHAPES: Record<PaletteStyle, StyleShape> = {
  // Square — the textbook baseline: even spread, full saturation.
  square: { lSpread: 1.0, cContrast: 1.0 },
  // Triangle — perceptual restraint: gentler lightness, slightly calmer chroma.
  triangle: { lSpread: 0.85, cContrast: 0.9 },
  // Circle — expressive: a wider lightness journey with a stronger chroma crescendo.
  circle: { lSpread: 1.12, cContrast: 1.25 },
  // Diamond — luminosity-led: the most dramatic lightness range.
  diamond: { lSpread: 1.25, cContrast: 1.15 },
}
