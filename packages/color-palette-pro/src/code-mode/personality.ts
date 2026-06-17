import type { PaletteKinds, PaletteStyle } from '../types'
import type {
  ModeBands,
  PaletteCharacter,
  PersonalityBgTint,
  PersonalityConfig,
  PersonalityFontStyleProfile,
  SurfaceProfile,
  SyntaxAccentRole,
} from './types'

/**
 * Personality system — calibrated against six reference themes:
 * VS Code Dark Modern, Night Owl, Kanagawa Wave, Dracula, Nord, One Dark Pro / One Light
 * (measured via scripts/theme-metrics.mts).
 *
 * What the references share, and what this module encodes:
 *
 *   1. All loud tokens live in a narrow lightness band with a consistent chroma
 *      ceiling. Identity comes from *which* roles get the saturated accent, not
 *      from global chroma multipliers. → TOKEN_BANDS (per lens) + ACCENT_ROLES
 *      (per character).
 *   2. Typography is nearly absent: Dark Modern and Nord use none; the others
 *      italicize comments only. → FONT_STYLES is comments-italic at most, plus a
 *      single signature treatment on the Cinematic lens.
 *   3. Background tint is a real signature (Night Owl bg chroma ≈ 0.045, Nord
 *      ≈ 0.02) — stronger than decoration, never loud. → BASE_BG_TINTS.
 *
 * Post-inversion (see ui.ts SURFACE_TREATMENT): the palette KIND owns the exemplar color
 * model (token bands + accent placement + bg-tint character), and the four STYLES are a
 * surface-material dial — Flat → Tinted → Toned → Brutalist — that no longer touches the
 * token bands.
 *   ana → Nord   com → Night Owl   spl → Dracula   tri → One Dark Pro   tet → Dark Modern
 *   tas/ton → monochrome
 */

// ----- palette character -----

// Character now follows each KIND's exemplar mood (post-inversion): Nord/Dark Modern read
// calm (serene), Night Owl/One Dark Pro medium-energy (crisp), Dracula neon (vivid), the
// monochrome kinds mono. Character drives ANSI saturation, peak-alpha, cursor + inactive
// selection — the "feel" knobs — while the token bands below carry the per-exemplar color
// distribution.
const PALETTE_CHARACTER: Record<PaletteKinds, PaletteCharacter> = {
  ana: 'serene', // Nord
  tet: 'serene', // Dark Modern (Dark Plus)
  com: 'crisp',  // Night Owl
  tri: 'crisp',  // One Dark Pro
  spl: 'vivid',  // Dracula
  tas: 'mono',   // monochrome
  ton: 'mono',   // tones
}

// ----- accent roles: where each KIND spends its saturation -----
//
// One or two roles get the chroma peak (band cHi); every other loud role is compressed
// below it. Energy through placement. Each kind mirrors its exemplar's signature pop:
//   ana → Nord's Frost function/type teal; spl → Dracula's pink keyword + green function
//   (two peaks); com/tri → Night Owl / One Dark purple keyword; tet → Dark Modern's
//   restrained blue keyword; mono kinds spend their one saturated step on accentColor.
const ACCENT_ROLES: Record<PaletteKinds, SyntaxAccentRole[]> = {
  ana: ['definitionColor'],
  com: ['keywordColor'],
  spl: ['keywordColor', 'definitionColor'],
  tri: ['keywordColor'],
  tet: ['keywordColor'],
  tas: ['accentColor'],
  ton: ['accentColor'],
}

// ----- token bands (per KIND = exemplar, mode-aware) -----
//
// Each kind's loud/quiet L+C envelope is its exemplar's measured OKLCH band (dark from
// `scripts/theme-metrics.mts`; light derived by the standard dark→light transform — light
// themes sit darker and run *more* chromatic, cf. One Light C 0.12–0.21). This is the core
// of the inversion: color distribution is now a property of the palette KIND, not the style.
//
//   ana → Nord (muted, tight)         com → Night Owl (expressive)
//   spl → Dracula (neon, wide)        tri → One Dark Pro
//   tet → Dark Modern / Dark Plus     tas/ton → synthetic monochrome
const TOKEN_BANDS: Record<PaletteKinds, { dark: ModeBands; light: ModeBands }> = {
  // Nord — measured L 0.69–0.77, C 0.048–0.075 (the most restrained exemplar).
  ana: {
    dark:  { loud: { lLo: 0.69, lHi: 0.79, cLo: 0.05, cHi: 0.085 }, quiet: { lLo: 0.69, lHi: 0.80, cHi: 0.06 } },
    light: { loud: { lLo: 0.46, lHi: 0.56, cLo: 0.085, cHi: 0.12 }, quiet: { lLo: 0.37, lHi: 0.50, cHi: 0.07 } },
  },
  // Night Owl — measured L 0.74–0.87, C 0.084–0.138; chromatic variables (qC 0.135).
  com: {
    dark:  { loud: { lLo: 0.72, lHi: 0.88, cLo: 0.085, cHi: 0.145 }, quiet: { lLo: 0.70, lHi: 0.84, cHi: 0.12 } },
    light: { loud: { lLo: 0.46, lHi: 0.62, cLo: 0.12, cHi: 0.18 }, quiet: { lLo: 0.35, lHi: 0.52, cHi: 0.10 } },
  },
  // Dracula — measured L 0.74–0.96, C 0.093–0.220 (the widest, most neon envelope).
  spl: {
    dark:  { loud: { lLo: 0.72, lHi: 0.92, cLo: 0.10, cHi: 0.19 }, quiet: { lLo: 0.70, lHi: 0.85, cHi: 0.10 } },
    light: { loud: { lLo: 0.44, lHi: 0.64, cLo: 0.13, cHi: 0.21 }, quiet: { lLo: 0.34, lHi: 0.52, cHi: 0.11 } },
  },
  // One Dark Pro — measured L 0.69–0.82, C 0.095–0.164.
  tri: {
    dark:  { loud: { lLo: 0.69, lHi: 0.83, cLo: 0.09, cHi: 0.16 }, quiet: { lLo: 0.70, lHi: 0.82, cHi: 0.12 } },
    light: { loud: { lLo: 0.45, lHi: 0.60, cLo: 0.12, cHi: 0.19 }, quiet: { lLo: 0.35, lHi: 0.52, cHi: 0.10 } },
  },
  // Dark Modern / Dark Plus — measured L 0.67–0.88, C 0.059–0.115 (structured, even).
  tet: {
    dark:  { loud: { lLo: 0.67, lHi: 0.86, cLo: 0.06, cHi: 0.12 }, quiet: { lLo: 0.70, lHi: 0.82, cHi: 0.10 } },
    light: { loud: { lLo: 0.46, lHi: 0.62, cLo: 0.10, cHi: 0.16 }, quiet: { lLo: 0.36, lHi: 0.52, cHi: 0.09 } },
  },
  // Monochrome — synthetic: a single hue tiered across L at low chroma.
  tas: {
    dark:  { loud: { lLo: 0.64, lHi: 0.86, cLo: 0.04, cHi: 0.10 }, quiet: { lLo: 0.66, lHi: 0.80, cHi: 0.05 } },
    light: { loud: { lLo: 0.40, lHi: 0.60, cLo: 0.06, cHi: 0.13 }, quiet: { lLo: 0.34, lHi: 0.50, cHi: 0.06 } },
  },
  // Tones — monochrome with a touch more chroma than pure tints/shades.
  ton: {
    dark:  { loud: { lLo: 0.64, lHi: 0.84, cLo: 0.05, cHi: 0.11 }, quiet: { lLo: 0.66, lHi: 0.80, cHi: 0.06 } },
    light: { loud: { lLo: 0.40, lHi: 0.58, cLo: 0.07, cHi: 0.14 }, quiet: { lLo: 0.34, lHi: 0.50, cHi: 0.07 } },
  },
}

// ----- background tint -----

// Target chroma added to the editor surface at full lens intensity, dark mode.
// Light mode applies ~35% of this (light exemplar bgs are near-neutral).
// Reference points: Night Owl 0.045, Nord 0.023, Dracula 0.022, Kanagawa 0.017.
const BASE_BG_TINTS: Record<PaletteKinds, PersonalityBgTint> = {
  ana: { chromaBoost: 0.014 },
  tri: { chromaBoost: 0.014 },
  com: { chromaBoost: 0.020 },
  tet: { chromaBoost: 0.016 },
  spl: { chromaBoost: 0.016 },
  tas: { chromaBoost: 0.030 },
  ton: { chromaBoost: 0.024 },
}

// Mode-aware editor bg L offsets at full character (vivid runs deeper darks /
// whiter lights; serene/mono lift slightly toward haze). Lens attenuates.
const BASE_BG_OFFSETS: Record<PaletteCharacter, { dark: number; light: number }> = {
  serene: { dark: +0.010, light: +0.010 },
  vivid:  { dark: -0.018, light: +0.009 },
  crisp:  { dark: -0.005, light: +0.005 },
  mono:   { dark: +0.012, light: +0.010 },
}

// ----- style lenses -----

interface StyleLens {
  name: string
  bgChromaIntensity: number // multiplier on BASE_BG_TINTS.chromaBoost
  bgOffsetIntensity: number // multiplier on BASE_BG_OFFSETS
}

// Post-inversion the STYLE is the surface-material dial (see ui.ts SURFACE_TREATMENT): it no
// longer carries token-band identity, only how much the kind's bg tint is applied and how the
// chrome reads. Names match the material progression neutral → brutalist.
const STYLE_LENSES: Record<PaletteStyle, StyleLens> = {
  square:   { name: 'Flat',      bgChromaIntensity: 0,    bgOffsetIntensity: 0 },
  triangle: { name: 'Tinted',    bgChromaIntensity: 0.45, bgOffsetIntensity: 0.35 },
  circle:   { name: 'Toned',     bgChromaIntensity: 0.85, bgOffsetIntensity: 0.80 },
  diamond:  { name: 'Brutalist', bgChromaIntensity: 1.15, bgOffsetIntensity: 1.30 },
}

// ----- font styles -----
//
// Font styling is a *lens* property only — it never varies by palette character.
// (Earlier the Cinematic lens added italic keywords for vivid and italic types for
// mono; in review that read as haphazard — two of four characters getting a
// different extra italic. The corpus confirms styling is a binary author choice,
// uncorrelated with palette mood.)
//
// Exemplar consensus: Dark Modern and Nord use no font styles at all; Night Owl,
// Kanagawa, One Dark, Tokyo Night italicize comments only. So:
//   square  — nothing (the engineered / stock-IDE read; Dark Modern / Nord)
//   triangle / circle / diamond — comments italic, nothing else.
// No code token is ever italicized. Bold is reserved for markdown headings, and
// markdown emphasis / blockquotes / editor ghost-text are italic because the
// *content* is italic, not as decoration (see base.ts / zed.ts).

const FONT_STYLES: Record<PaletteStyle, PersonalityFontStyleProfile> = {
  square:   { comments: '' },
  triangle: { comments: 'italic' },
  circle:   { comments: 'italic' },
  diamond:  { comments: 'italic' },
}

// ----- surface profile: (lens × character) → chrome behavior -----

// Editor L in dark mode by lens. Editor is the deepest point; chrome lifts above it.
const EDITOR_L_DARK_BY_LENS: Record<PaletteStyle, number> = {
  square:   0.230, // engineered baseline (~VS Code Dark+)
  triangle: 0.245, // natural — slightly lighter
  circle:   0.230, // expressive — chrome tint compensates for tight gap
  diamond:  0.195, // cinematic — theatrical depth, still the darkest lens
}

// Editor L in light mode by character. Vivid pushes to pure white for max contrast;
// serene/mono stay slightly off-white for long-session comfort.
const EDITOR_L_LIGHT_BY_CHARACTER: Record<PaletteCharacter, number> = {
  serene: 0.98,
  mono:   0.98,
  crisp:  0.99,
  vivid:  1.00,
}

// Peak alpha for the unified chromatic highlight ramp. Light is roughly half of dark —
// primary on white reads much harder than primary on near-black.
const PEAK_ALPHA_BY_CHARACTER: Record<PaletteCharacter, { dark: number; light: number }> = {
  serene: { dark: 0.55, light: 0.25 },
  crisp:  { dark: 0.70, light: 0.30 },
  mono:   { dark: 0.75, light: 0.32 },
  vivid:  { dark: 0.85, light: 0.40 },
}

// Sidebar surface routing. Corpus rule: in dark mode the sidebar sits at or *below*
// the editor's lightness (13 of 15 top themes; Dark Modern −0.03, GitHub Dark −0.07) —
// the editor is the lightest text surface, chrome recedes. Light mode mirrors this
// with chrome slightly darker than the near-white editor.
const SIDEBAR_SURFACE_BY_LENS: Record<PaletteStyle, SurfaceProfile['sidebarSurface']> = {
  square:   { dark: 'containerSunken', light: 'container' },
  triangle: { dark: 'containerSunken', light: 'container' },
  circle:   { dark: 'containerSunken', light: 'container' },
  diamond:  { dark: 'containerSunken', light: 'containerSunken' },
}

const CHROME_TINT_BY_LENS: Record<PaletteStyle, boolean> = {
  square:   false,
  triangle: false,
  circle:   true,
  diamond:  true,
}

// Square is the "stock IDE" lens — its surfaces stay fully neutral (Dark Modern,
// Vitesse, min-light all run chrome at chroma ≤ 0.003). Other lenses tint, but
// chrome chroma is clamped to the editor bg's own tint downstream.
const CHROME_NEUTRAL_BY_LENS: Record<PaletteStyle, boolean> = {
  square:   true,
  triangle: false,
  circle:   false,
  diamond:  false,
}

const STATUS_BAR_STYLE_BY_LENS: Record<PaletteStyle, SurfaceProfile['statusBarStyle']> = {
  square:   'match-sidebar',
  triangle: 'tinted',
  circle:   'primary',
  diamond:  'primary-deep',
}

// Cursor source: loud characters keep accent; calm characters use foreground (2026-style).
const CURSOR_SOURCE_BY_CHARACTER: Record<PaletteCharacter, SurfaceProfile['cursorSource']> = {
  serene: 'foreground',
  mono:   'foreground',
  crisp:  'accent',
  vivid:  'accent',
}

// Inactive selection — when focus leaves, where does identity go?
// Vivid pulls a complementary hue (Night Owl move). Mono falls back to a neutral solid
// since there's no complement to spend. Serene/crisp keep chromatic continuity.
const INACTIVE_SELECTION_BY_CHARACTER: Record<PaletteCharacter, SurfaceProfile['inactiveSelectionStyle']> = {
  serene: 'chromatic',
  crisp:  'chromatic',
  vivid:  'complementary',
  mono:   'neutral',
}

// Diamond warms the neutral band with a whisper of primary; everyone else stays neutral.
const NEUTRAL_BAND_TINT_BY_LENS: Record<PaletteStyle, number> = {
  square:   0,
  triangle: 0,
  circle:   0,
  diamond:  0.15,
}

function buildSurfaceProfile(kind: PaletteKinds, style: PaletteStyle): SurfaceProfile {
  const character = PALETTE_CHARACTER[kind]
  return {
    editorLDark:            EDITOR_L_DARK_BY_LENS[style],
    editorLLight:           EDITOR_L_LIGHT_BY_CHARACTER[character],
    peakAlpha:              PEAK_ALPHA_BY_CHARACTER[character],
    sidebarSurface:         SIDEBAR_SURFACE_BY_LENS[style],
    chromeTint:             CHROME_TINT_BY_LENS[style],
    chromeNeutral:          CHROME_NEUTRAL_BY_LENS[style],
    statusBarStyle:         STATUS_BAR_STYLE_BY_LENS[style],
    cursorSource:           CURSOR_SOURCE_BY_CHARACTER[character],
    inactiveSelectionStyle: INACTIVE_SELECTION_BY_CHARACTER[character],
    neutralBandTint:        NEUTRAL_BAND_TINT_BY_LENS[style],
  }
}

// ----- resolution -----

function scaledBgTint(base: PersonalityBgTint, intensity: number): PersonalityBgTint | null {
  if (intensity <= 0) return null
  return { chromaBoost: base.chromaBoost * intensity }
}

export function getPersonalityConfig(kind: PaletteKinds, style: PaletteStyle): PersonalityConfig {
  const lens = STYLE_LENSES[style]
  const character = PALETTE_CHARACTER[kind]
  const offsets = BASE_BG_OFFSETS[character]

  return {
    bgTint: scaledBgTint(BASE_BG_TINTS[kind], lens.bgChromaIntensity),
    tokenBands: TOKEN_BANDS[kind],
    bgOffset: {
      dark: offsets.dark * lens.bgOffsetIntensity,
      light: offsets.light * lens.bgOffsetIntensity,
    },
    accentRoles: ACCENT_ROLES[kind],
    fontStyleProfile: FONT_STYLES[style],
    surfaceProfile: buildSurfaceProfile(kind, style),
    lensName: lens.name,
    paletteCharacter: character,
  }
}
