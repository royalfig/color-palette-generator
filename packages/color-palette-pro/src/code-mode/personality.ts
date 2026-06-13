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
 * The four style lenses set the band envelope:
 *   square   → "Engineered"  — Dark Modern / Nord numbers. No font styles, no tint.
 *   triangle → "Natural"     — Kanagawa-comfortable: slightly tighter, softer band.
 *   circle   → "Expressive"  — One Dark / Night Owl: fuller chroma, visible bg tint.
 *   diamond  → "Cinematic"   — Dracula envelope: widest L band, highest chroma peak.
 */

// ----- palette character -----

const PALETTE_CHARACTER: Record<PaletteKinds, PaletteCharacter> = {
  ana: 'serene',
  tri: 'serene',
  com: 'vivid',
  tet: 'vivid',
  spl: 'crisp',
  tas: 'mono',
  ton: 'mono',
}

// ----- accent roles: where each character spends its saturation -----
//
// One or two roles per character get the chroma peak (band cHi); every other loud
// role is compressed below it. This is the Dracula/Night Owl move — energy through
// placement. The role choice aligns with what the templates already put there:
// complementary/tetradic route the complement hue to keywords, so vivid accents
// keywords; analogous/triadic keep everything in-family, so serene lifts the
// function color (the Night Owl blue-pop); mono palettes spend their one allowed
// counter-hue on accentColor (this/self/booleans + template punctuation).

const ACCENT_ROLES: Record<PaletteCharacter, SyntaxAccentRole[]> = {
  serene: ['definitionColor'],
  vivid: ['keywordColor'],
  crisp: ['keywordColor'],
  mono: ['accentColor'],
}

// ----- token bands (per lens, mode-aware) -----
//
// Measured exemplar ranges (dark): loud L 0.64–0.96 with per-theme spread 0.08–0.21,
// loud C 0.05–0.22 with per-theme spread ≤ 0.07 outside Dracula. Light themes run
// *more* chromatic than dark (One Light C 0.12–0.21) at L 0.52–0.66.

const TOKEN_BANDS: Record<PaletteStyle, { dark: ModeBands; light: ModeBands }> = {
  // Engineered: Dark Modern / Nord territory.
  square: {
    dark:  { loud: { lLo: 0.67, lHi: 0.85, cLo: 0.06, cHi: 0.12 }, quiet: { lLo: 0.70, lHi: 0.82, cHi: 0.08 } },
    light: { loud: { lLo: 0.46, lHi: 0.62, cLo: 0.10, cHi: 0.16 }, quiet: { lLo: 0.36, lHi: 0.52, cHi: 0.09 } },
  },
  // Natural: Kanagawa-comfortable — tighter, softer.
  triangle: {
    dark:  { loud: { lLo: 0.66, lHi: 0.81, cLo: 0.05, cHi: 0.10 }, quiet: { lLo: 0.69, lHi: 0.80, cHi: 0.06 } },
    light: { loud: { lLo: 0.47, lHi: 0.62, cLo: 0.09, cHi: 0.14 }, quiet: { lLo: 0.37, lHi: 0.52, cHi: 0.07 } },
  },
  // Expressive: One Dark / Night Owl.
  circle: {
    dark:  { loud: { lLo: 0.70, lHi: 0.86, cLo: 0.09, cHi: 0.15 }, quiet: { lLo: 0.71, lHi: 0.83, cHi: 0.09 } },
    light: { loud: { lLo: 0.44, lHi: 0.63, cLo: 0.12, cHi: 0.18 }, quiet: { lLo: 0.35, lHi: 0.52, cHi: 0.10 } },
  },
  // Cinematic: Dracula envelope.
  diamond: {
    dark:  { loud: { lLo: 0.72, lHi: 0.90, cLo: 0.10, cHi: 0.18 }, quiet: { lLo: 0.72, lHi: 0.84, cHi: 0.10 } },
    light: { loud: { lLo: 0.42, lHi: 0.63, cLo: 0.13, cHi: 0.20 }, quiet: { lLo: 0.34, lHi: 0.52, cHi: 0.11 } },
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

const STYLE_LENSES: Record<PaletteStyle, StyleLens> = {
  square:   { name: 'Engineered', bgChromaIntensity: 0,    bgOffsetIntensity: 0 },
  triangle: { name: 'Natural',    bgChromaIntensity: 0.45, bgOffsetIntensity: 0.35 },
  circle:   { name: 'Expressive', bgChromaIntensity: 0.85, bgOffsetIntensity: 0.80 },
  diamond:  { name: 'Cinematic',  bgChromaIntensity: 1.15, bgOffsetIntensity: 1.30 },
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
    tokenBands: TOKEN_BANDS[style],
    bgOffset: {
      dark: offsets.dark * lens.bgOffsetIntensity,
      light: offsets.light * lens.bgOffsetIntensity,
    },
    accentRoles: ACCENT_ROLES[character],
    fontStyleProfile: FONT_STYLES[style],
    surfaceProfile: buildSurfaceProfile(kind, style),
    lensName: lens.name,
    paletteCharacter: character,
  }
}
