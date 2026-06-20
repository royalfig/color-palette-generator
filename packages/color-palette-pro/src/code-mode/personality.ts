import type { PaletteKinds, PaletteStyle } from "../types/types";
import type {
  ModeBands,
  PaletteCharacter,
  PersonalityConfig,
  PersonalityFontStyleProfile,
  SurfaceProfile,
  SyntaxAccentRole,
} from "./types";

/**
 * Personality system — calibrated against six reference themes:
 * VS Code Dark Modern, Night Owl, Kanagawa Wave, Dracula, Nord, One Dark Pro / One Light
 * (measured via scripts/theme-metrics.mts).
 *
 * Post-inversion the palette KIND owns the exemplar color model (token bands + accent
 * placement), and the four STYLES are the surface-material dial in ui.ts SURFACE_TREATMENT —
 * which code-mode now inherits directly (surfaces / foreground / outline are a passthrough, see
 * buildThemeData). What remains here: per-kind token bands + accent roles, per-style font styles
 * + lens label, and the character-driven "feel" knobs (peak-alpha, cursor, inactive selection,
 * neutral-band tint).
 *   ana → Nord   com → Night Owl   spl → Dracula   tri → One Dark Pro   tet → Dark Modern
 *   tas → monochrome
 */

// ----- palette character -----

// Character follows each KIND's exemplar mood: Nord/Dark Modern read calm (serene), Night Owl/
// One Dark Pro medium-energy (crisp), Dracula neon (vivid), the monochrome kinds mono. Character
// drives ANSI saturation, peak-alpha, cursor + inactive selection — the "feel" knobs — while the
// token bands below carry the per-exemplar color distribution.
const PALETTE_CHARACTER: Record<PaletteKinds, PaletteCharacter> = {
  ana: "serene", // Nord
  tet: "serene", // Dark Modern (Dark Plus)
  com: "crisp", // Night Owl
  tri: "crisp", // One Dark Pro
  spl: "vivid", // Dracula
  tas: "mono", // monochrome
};

// ----- accent roles: where each KIND spends its saturation -----
//
// One or two roles get the chroma peak (band cHi); every other loud role is compressed
// below it. Energy through placement. Each kind mirrors its exemplar's signature pop:
//   ana → Nord's Frost function/type teal; spl → Dracula's pink keyword + green function
//   (two peaks); com/tri → Night Owl / One Dark purple keyword; tet → Dark Modern's
//   restrained blue keyword; mono kinds spend their one saturated step on accentColor.
const ACCENT_ROLES: Record<PaletteKinds, SyntaxAccentRole[]> = {
  ana: ["definitionColor"],
  com: ["keywordColor"],
  spl: ["keywordColor", "definitionColor"],
  tri: ["keywordColor"],
  tet: ["keywordColor"],
  tas: ["accentColor"],
};

// ----- token bands (per KIND = exemplar, mode-aware) -----
//
// Each kind's loud/quiet L+C envelope is its exemplar's measured OKLCH band (dark from
// `scripts/theme-metrics.mts`; light derived by the standard dark→light transform — light
// themes sit darker and run *more* chromatic, cf. One Light C 0.12–0.21). This is the core
// of the inversion: color distribution is now a property of the palette KIND, not the style.
//
//   ana → Nord (muted, tight)         com → Night Owl (expressive)
//   spl → Dracula (neon, wide)        tri → One Dark Pro
//   tet → Dark Modern / Dark Plus     tas → synthetic monochrome
const TOKEN_BANDS: Record<PaletteKinds, { dark: ModeBands; light: ModeBands }> =
  {
    // Nord — measured L 0.69–0.77, C 0.048–0.075 (the most restrained exemplar).
    ana: {
      dark: {
        loud: { lLo: 0.69, lHi: 0.79, cLo: 0.05, cHi: 0.085 },
        quiet: { lLo: 0.69, lHi: 0.8, cHi: 0.06 },
      },
      light: {
        loud: { lLo: 0.46, lHi: 0.56, cLo: 0.085, cHi: 0.12 },
        quiet: { lLo: 0.37, lHi: 0.5, cHi: 0.07 },
      },
    },
    // Night Owl — measured L 0.74–0.87, C 0.084–0.138; chromatic variables (qC 0.135).
    com: {
      dark: {
        loud: { lLo: 0.72, lHi: 0.88, cLo: 0.085, cHi: 0.145 },
        quiet: { lLo: 0.7, lHi: 0.84, cHi: 0.12 },
      },
      light: {
        loud: { lLo: 0.46, lHi: 0.62, cLo: 0.12, cHi: 0.18 },
        quiet: { lLo: 0.35, lHi: 0.52, cHi: 0.1 },
      },
    },
    // Dracula — measured L 0.74–0.96, C 0.093–0.220 (the widest, most neon envelope).
    spl: {
      dark: {
        loud: { lLo: 0.72, lHi: 0.92, cLo: 0.1, cHi: 0.19 },
        quiet: { lLo: 0.7, lHi: 0.85, cHi: 0.1 },
      },
      light: {
        loud: { lLo: 0.44, lHi: 0.64, cLo: 0.13, cHi: 0.21 },
        quiet: { lLo: 0.34, lHi: 0.52, cHi: 0.11 },
      },
    },
    // One Dark Pro — measured L 0.69–0.82, C 0.095–0.164.
    tri: {
      dark: {
        loud: { lLo: 0.69, lHi: 0.83, cLo: 0.09, cHi: 0.16 },
        quiet: { lLo: 0.7, lHi: 0.82, cHi: 0.12 },
      },
      light: {
        loud: { lLo: 0.45, lHi: 0.6, cLo: 0.12, cHi: 0.19 },
        quiet: { lLo: 0.35, lHi: 0.52, cHi: 0.1 },
      },
    },
    // Dark Modern / Dark Plus — measured L 0.67–0.88, C 0.059–0.115 (structured, even).
    tet: {
      dark: {
        loud: { lLo: 0.67, lHi: 0.86, cLo: 0.06, cHi: 0.12 },
        quiet: { lLo: 0.7, lHi: 0.82, cHi: 0.1 },
      },
      light: {
        loud: { lLo: 0.46, lHi: 0.62, cLo: 0.1, cHi: 0.16 },
        quiet: { lLo: 0.36, lHi: 0.52, cHi: 0.09 },
      },
    },
    // Monochrome — synthetic: a single hue tiered across L at low chroma.
    tas: {
      dark: {
        loud: { lLo: 0.64, lHi: 0.86, cLo: 0.04, cHi: 0.1 },
        quiet: { lLo: 0.66, lHi: 0.8, cHi: 0.05 },
      },
      light: {
        loud: { lLo: 0.4, lHi: 0.6, cLo: 0.06, cHi: 0.13 },
        quiet: { lLo: 0.34, lHi: 0.5, cHi: 0.06 },
      },
    },
  };

// ----- lens label (per style) -----
//
// The style's surface-material name (shown in theme descriptions). The material behavior itself
// lives in ui.ts SURFACE_TREATMENT and reaches code-mode via the surface passthrough.
const LENS_NAMES: Record<PaletteStyle, string> = {
  square: "Flat",
  triangle: "Tinted",
  circle: "Toned",
  diamond: "Brutalist",
};

// ----- font styles -----
//
// Font styling is a *lens* property only — it never varies by palette character. Exemplar
// consensus: Dark Modern and Nord use no font styles at all; Night Owl, Kanagawa, One Dark,
// Tokyo Night italicize comments only. So square = nothing (the engineered / stock-IDE read);
// triangle / circle / diamond = comments italic, nothing else. No code token is ever italicized.
const FONT_STYLES: Record<PaletteStyle, PersonalityFontStyleProfile> = {
  square: { comments: "" },
  triangle: { comments: "italic" },
  circle: { comments: "italic" },
  diamond: { comments: "italic" },
};

// ----- character-driven "feel" knobs -----

// Peak alpha for the unified chromatic highlight ramp. Light is roughly half of dark —
// primary on white reads much harder than primary on near-black.
const PEAK_ALPHA_BY_CHARACTER: Record<
  PaletteCharacter,
  { dark: number; light: number }
> = {
  serene: { dark: 0.55, light: 0.25 },
  crisp: { dark: 0.7, light: 0.3 },
  mono: { dark: 0.75, light: 0.32 },
  vivid: { dark: 0.85, light: 0.4 },
};

// Cursor source: loud characters keep accent; calm characters use foreground (2026-style).
const CURSOR_SOURCE_BY_CHARACTER: Record<
  PaletteCharacter,
  SurfaceProfile["cursorSource"]
> = {
  serene: "foreground",
  mono: "foreground",
  crisp: "accent",
  vivid: "accent",
};

// Inactive selection — when focus leaves, where does identity go?
// Vivid pulls a complementary hue (Night Owl move). Mono falls back to a neutral solid
// since there's no complement to spend. Serene/crisp keep chromatic continuity.
const INACTIVE_SELECTION_BY_CHARACTER: Record<
  PaletteCharacter,
  SurfaceProfile["inactiveSelectionStyle"]
> = {
  serene: "chromatic",
  crisp: "chromatic",
  vivid: "complementary",
  mono: "neutral",
};

// Diamond warms the neutral band with a whisper of primary; everyone else stays neutral.
const NEUTRAL_BAND_TINT_BY_LENS: Record<PaletteStyle, number> = {
  square: 0,
  triangle: 0,
  circle: 0,
  diamond: 0.15,
};

function buildSurfaceProfile(
  kind: PaletteKinds,
  style: PaletteStyle,
): SurfaceProfile {
  const character = PALETTE_CHARACTER[kind];
  return {
    peakAlpha: PEAK_ALPHA_BY_CHARACTER[character],
    cursorSource: CURSOR_SOURCE_BY_CHARACTER[character],
    inactiveSelectionStyle: INACTIVE_SELECTION_BY_CHARACTER[character],
    neutralBandTint: NEUTRAL_BAND_TINT_BY_LENS[style],
  };
}

// ----- resolution -----

export function getPersonalityConfig(
  kind: PaletteKinds,
  style: PaletteStyle,
): PersonalityConfig {
  return {
    tokenBands: TOKEN_BANDS[kind],
    accentRoles: ACCENT_ROLES[kind],
    fontStyleProfile: FONT_STYLES[style],
    surfaceProfile: buildSurfaceProfile(kind, style),
    lensName: LENS_NAMES[style],
    paletteCharacter: PALETTE_CHARACTER[kind],
  };
}
