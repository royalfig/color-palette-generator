import type { PaletteStyle } from "../types/types";

// Shared constants for the code-mode generation pipeline: role lists, perceptual contrast
// targets, chroma tiers, and the ANSI terminal-palette tables. Kept data-only so the syntax
// pipeline (syntax.ts), ANSI derivation (ansi.ts), intensity (intensity.ts) and the
// orchestrator (index.ts) all share one source of truth.

// Loud syntax roles — the chromatic tokens normalized into the kind's token band.
export const LOUD_ROLES = [
  "definitionColor",
  "keywordColor",
  "typeColor",
  "stringColor",
  "numberColor",
  "regexColor",
  "accentColor",
] as const;

// Roles whose visual distinctness matters, ordered by typical token frequency in code.
// Frequency-weighted enforcement: high-frequency roles claim hue space first; less-frequent
// roles adapt around them. keyword and string dominate most languages; type is rarest.
export const DISTINCT_ROLES_BY_FREQ = [
  "keywordColor",
  "stringColor",
  "definitionColor",
  "numberColor",
  "typeColor",
] as const;

// Role hue conventions, measured across the top-marketplace corpus (dark themes;
// light themes follow the same families). Each role has one or two anchor hues:
//   strings:   warm-to-green (14/15 themes in 30–146)
//   keywords:  purple/magenta 300–350 or blue 230–250
//   functions: blue ~245–265 or yellow ~107
//   types:     teal/cyan 160–220 or gold ~80
//   numbers:   warm orange 7–63 or purple ~300 (Dracula school)
// The matcher permutes the template's loud colors among these roles to honor the
// conventions — same palette, conventional placement.
export const ROLE_HUE_ANCHORS: Record<
  (typeof DISTINCT_ROLES_BY_FREQ)[number],
  number[]
> = {
  keywordColor: [315, 240],
  stringColor: [120, 45],
  definitionColor: [255, 105],
  numberColor: [40, 310],
  typeColor: [190, 80],
};

// APCA contrast targets (perceptual; Lc scale):
//   75 = body text (the gold standard)
//   60 = fluent text (acceptable for syntax tokens)
//   45 = incidental UI text
//   30 = decorative / spot text
export const APCA_TARGET_LOUD = 60;
export const APCA_TARGET_QUIET = 45;

// Comments are a *band*, not just a floor: the exemplar themes run comments at
// Lc 18–52 (Nord 21, One Dark 18, Dark Modern 41, One Light 52) — clearly recessed.
// We hold them slightly above the exemplar low end for readability, but cap them
// so they never compete with code. Light bgs need more Lc for the same recessed feel.
export const APCA_COMMENT_MIN = 30;
export const APCA_COMMENT_MAX_DARK = 44;
export const APCA_COMMENT_MAX_LIGHT = 52;
export const APCA_TARGET_SELECTION_OVERLAY = 30;

// Quiet-role chroma tiers (measured from exemplars): identifiers (variable/property)
// carry a real tint — Dark Modern's variable #9CDCFE is C 0.109 — while structural
// glue (operator/punctuation) and comments stay close to neutral.
export const STRUCTURAL_C_MAX = 0.04;
export const COMMENT_C_MAX = 0.05;

export const IDENTIFIER_ROLES = ["variableColor", "propertyColor"] as const;
export const STRUCTURAL_ROLES = ["operatorColor", "punctuationColor"] as const;

// Red (≈345–25°) is reserved vocabulary: the corpus uses it for tags, operators and
// keywords, never strings/functions and almost never numbers — a saturated red
// string reads as an error. These roles avoid the zone at every pipeline stage.
export const RED_SENSITIVE_ROLES: ReadonlySet<string> = new Set([
  "stringColor",
  "definitionColor",
  "numberColor",
]);

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
// The lens is the deliberate-mismap dial: square stays faithful (terminal-correct),
// diamond drifts hard toward the palette (cinematic identity).

export interface AnsiSlot {
  hue: number;
  drift: number;
}
export const ANSI_SLOTS: Record<
  "red" | "green" | "yellow" | "blue" | "magenta" | "cyan",
  AnsiSlot
> = {
  red: { hue: 25, drift: 24 }, // load-bearing (diff/errors) — narrowest leeway
  green: { hue: 145, drift: 34 },
  yellow: { hue: 95, drift: 34 },
  blue: { hue: 250, drift: 62 }, // decorative end — roams to the palette (Dracula purple-blue)
  magenta: { hue: 330, drift: 52 },
  cyan: { hue: 200, drift: 48 },
};

// Fraction of each slot's max hue drift the lens permits (square faithful → diamond full,
// with a little overshoot so the Cinematic lens reads as deliberately stylised).
export const ANSI_DRIFT_BY_LENS: Record<PaletteStyle, number> = {
  square: 0.35,
  triangle: 0.62,
  circle: 0.88,
  diamond: 1.12,
};

// Chroma *centre* — the muted↔neon identity axis — is seed-driven (see intensity.ts):
// the base color's chroma remaps into [ANSI_C_BAND], shape modulates that anchor by
// SHAPE_INTENSITY, clamped to ANSI_C_CEILING. The actual per-slot chroma is then pulled
// toward each palette swatch's own chroma (see ansi.ts), so slots vary around the centre
// instead of sitting flat on it.
export const ANSI_C_BAND: [number, number] = [0.06, 0.17];
export const ANSI_C_CEILING = 0.2;
export const SHAPE_INTENSITY: Record<PaletteStyle, number> = {
  square: 0.9,
  triangle: 1.0,
  circle: 1.12,
  diamond: 1.25,
};

// How strongly each slot's chroma & lightness follow the palette swatch they land on
// (the per-slot spread). Square stays tight/uniform (engineered); diamond lets the
// palette's own contrast through (cinematic). Keeps the 16 colours from looking flat.
export const ANSI_CHROMA_FOLLOW_BY_LENS: Record<PaletteStyle, number> = {
  square: 0.25,
  triangle: 0.45,
  circle: 0.65,
  diamond: 0.85,
};
// Amplitude of the hue-natural lightness spread (yellow/green lift, blue/magenta deepen).
export const ANSI_L_SPREAD_BY_LENS: Record<PaletteStyle, number> = {
  square: 0.055,
  triangle: 0.085,
  circle: 0.115,
  diamond: 0.15,
};
