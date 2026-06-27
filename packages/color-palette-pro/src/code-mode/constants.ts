import type { PaletteStyle } from '../types/types'

// Shared constants for the code-mode generation pipeline: role lists, perceptual contrast
// targets, chroma tiers, and the ANSI terminal-palette tables. Kept data-only so the syntax
// pipeline (syntax.ts), ANSI derivation (ansi.ts), intensity (intensity.ts) and the
// orchestrator (index.ts) all share one source of truth.

// Loud syntax roles — the chromatic tokens normalized into the kind's token band.
export const LOUD_ROLES = [
  'definitionColor',
  'keywordColor',
  'typeColor',
  'stringColor',
  'numberColor',
  'regexColor',
  'accentColor',
] as const

// Roles whose visual distinctness matters, ordered by typical token frequency in code.
// Frequency-weighted enforcement: high-frequency roles anchor the lightness/chroma space and
// less-frequent roles step around them. keyword and string dominate most languages; type is rarest.
export const DISTINCT_ROLES_BY_FREQ = [
  'keywordColor',
  'stringColor',
  'definitionColor',
  'numberColor',
  'typeColor',
] as const

// APCA contrast targets (perceptual; Lc scale):
//   75 = body text (the gold standard)
//   60 = fluent text (acceptable for syntax tokens)
//   45 = incidental UI text
//   30 = decorative / spot text
export const APCA_TARGET_LOUD = 60
export const APCA_TARGET_QUIET = 45

// Comments are a *band*, not just a floor: the exemplar themes run comments at
// Lc 18–52 (Nord 21, One Dark 18, Dark Modern 41, One Light 52) — clearly recessed.
// We hold them slightly above the exemplar low end for readability, but cap them
// so they never compete with code. Light bgs need more Lc for the same recessed feel.
export const APCA_COMMENT_MIN = 30
export const APCA_COMMENT_MAX_DARK = 44
export const APCA_COMMENT_MAX_LIGHT = 52
export const APCA_TARGET_SELECTION_OVERLAY = 30

// Quiet-role chroma tiers (measured from exemplars): identifiers (variable/property)
// carry a real tint — Dark Modern's variable #9CDCFE is C 0.109 — while structural
// glue (operator/punctuation) and comments stay close to neutral.
export const STRUCTURAL_C_MAX = 0.04
export const COMMENT_C_MAX = 0.05

export const IDENTIFIER_ROLES = ['variableColor', 'propertyColor'] as const
export const STRUCTURAL_ROLES = ['operatorColor', 'punctuationColor'] as const

// Hero token: the corpus themes have a clear chromatic lead — one token noticeably more saturated
// than the rest — so the eye has somewhere to land. The palette-primary pipeline, having dropped the
// old forced accent-peak, flattened every loud role into one mid-chroma band (measured output ran
// C 0.07–0.13 with no peak). This restores a single peak: the keyword (the most frequent loud token
// and the conventional lead) is guaranteed to clear the rest of the loud field by HERO_CHROMA_GAP,
// capped at the band ceiling. It only raises chroma — hue (palette identity) and L (contrast) are
// untouched — so it's a prominence dial, not a restyle.
export const HERO_ROLE = 'keywordColor' as const
export const HERO_CHROMA_GAP = 0.045

// Generic, mode-only readability band (palette-primary redesign). The syntax pipeline preserves
// every token's *hue and relative chroma* from the palette; this band only governs the L window a
// token must sit in to stay legible, plus sane chroma floors/ceilings. There is deliberately NO
// per-kind variant — the old per-exemplar TOKEN_BANDS (Nord/Dracula envelopes) are what made every
// palette converge on the same six famous looks. Loud = code tokens; quiet = identifiers/structural.
export interface ReadBand {
  loud: { lLo: number; lHi: number; cFloor: number; cCeil: number }
  quiet: { lLo: number; lHi: number; cFloor: number; cCeil: number }
}
export const READABILITY_BAND: { dark: ReadBand; light: ReadBand } = {
  dark: {
    loud: { lLo: 0.62, lHi: 0.9, cFloor: 0.045, cCeil: 0.2 },
    quiet: { lLo: 0.6, lHi: 0.82, cFloor: 0.015, cCeil: 0.12 },
  },
  light: {
    loud: { lLo: 0.34, lHi: 0.62, cFloor: 0.055, cCeil: 0.21 },
    quiet: { lLo: 0.34, lHi: 0.55, cFloor: 0.015, cCeil: 0.11 },
  },
}

// Red (≈345–25°) is reserved vocabulary: the corpus uses it for tags, operators and
// keywords, never strings/functions and almost never numbers — a saturated red
// string reads as an error. These roles avoid the zone at every pipeline stage.
export const RED_SENSITIVE_ROLES: ReadonlySet<string> = new Set(['stringColor', 'definitionColor', 'numberColor'])

// ----- ANSI terminal palette: deliberate, palette-driven "mismapping" -----
//
// A terminal theme's identity comes from the seed palette being *applied* to the ANSI
// slots, even when that means a slot drifts off its textbook hue — Dracula's "blue" is
// purple (Δ+51°), Synthwave's too (+48°), because those are purple-dominant palettes.
// Measured from the corpus:
//   1. Chroma is the dominant identity axis — Nord/Vitesse 0.06–0.14 (muted) vs
//      Dracula/Synthwave 0.15–0.22 (neon). Driven by seed intensity here (intensity.ts).
//   2. Hue drift is asymmetric: red/green/yellow stay anchored (errors, diff, warnings
//      depend on them), blue/magenta/cyan roam toward the palette (decorative end).
//   3. The drift pulls toward the palette's actual hues, not randomly.
// The mismap is palette-driven only: the pull toward the seed palette's hues is identical across
// styles. Style is material (chroma / lightness), never hue — so ANSI hue no longer changes when
// you switch square↔diamond. The per-slot caps keep the load-bearing slots anchored while the
// decorative slots roam toward the palette.

export interface AnsiSlot {
  hue: number
  drift: number
  // Hue-natural chroma multiplier. A flat ANSI ramp (every slot the same chroma) is the dead
  // giveaway of a generated terminal theme; the loved ones aren't flat — they carry an intrinsic
  // saturation profile where red/green/magenta run punchy and yellow/cyan sit softer (measured:
  // Dracula red 0.21 / cyan 0.09; Tokyo Night red 0.16 / cyan/yellow 0.11). This scales each slot's
  // computed chroma so the ramp has life even when the seed palette's swatches are uniform.
  cScale: number
}
export const ANSI_SLOTS: Record<'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan', AnsiSlot> = {
  red: { hue: 25, drift: 24, cScale: 1.15 }, // load-bearing (diff/errors) — narrowest leeway, runs punchy
  green: { hue: 145, drift: 34, cScale: 1.1 },
  yellow: { hue: 95, drift: 34, cScale: 0.85 }, // intrinsically light — softer chroma reads cleaner
  blue: { hue: 250, drift: 62, cScale: 1.0 }, // decorative end — roams to the palette (Dracula purple-blue)
  magenta: { hue: 330, drift: 52, cScale: 1.05 },
  cyan: { hue: 200, drift: 48, cScale: 0.8 }, // softest, like the corpus
}

// Fraction of each slot's max hue drift permitted — one global factor, applied to every style
// (Phase 0 of the palette-primary redesign: hue is no longer a style axis). Sits at the expressive
// end so the palette-driven mismap (Dracula's purple-blue) still reads, while each slot's own cap
// holds the load-bearing colors (red/green/yellow) near canonical for git diff / errors / warnings.
// Tunable: lower → more terminal-faithful, higher → snaps harder onto the palette's hues.
export const ANSI_DRIFT_FACTOR = 0.82

// Chroma *centre* — the muted↔neon identity axis — is seed-driven (see intensity.ts):
// the base color's chroma remaps into [ANSI_C_BAND], shape modulates that anchor by
// SHAPE_INTENSITY, clamped to ANSI_C_CEILING. The actual per-slot chroma is then pulled
// toward each palette swatch's own chroma (see ansi.ts), so slots vary around the centre
// instead of sitting flat on it.
export const ANSI_C_BAND: [number, number] = [0.06, 0.17]
export const ANSI_C_CEILING = 0.2
export const SHAPE_INTENSITY: Record<PaletteStyle, number> = {
  square: 0.9,
  triangle: 1.0,
  circle: 1.12,
  diamond: 1.25,
}

// How strongly each slot's chroma & lightness follow the palette swatch they land on
// (the per-slot spread). Square stays tight/uniform (engineered); diamond lets the
// palette's own contrast through (cinematic). Keeps the 16 colours from looking flat.
export const ANSI_CHROMA_FOLLOW_BY_LENS: Record<PaletteStyle, number> = {
  square: 0.5,
  triangle: 0.6,
  circle: 0.78,
  diamond: 0.95,
}
// Amplitude of the hue-natural lightness spread (yellow/green lift, blue/magenta deepen). Even the
// restrained corpus themes spread their ANSI lightness ≥0.10 (Tokyo Night) and the bold ones ≥0.28
// (Dracula); the old square 0.055 produced a near-flat ramp, so the floor is lifted across lenses.
export const ANSI_L_SPREAD_BY_LENS: Record<PaletteStyle, number> = {
  square: 0.09,
  triangle: 0.11,
  circle: 0.135,
  diamond: 0.17,
}
