import type { PaletteKinds, PaletteStyle } from '../types'
import type {
  PaletteCharacter,
  PersonalityBgTint,
  PersonalityConfig,
  PersonalityContrastProfile,
  PersonalityFontStyleProfile,
  SurfaceProfile,
} from './types'

/**
 * Personality system — philosophy-driven, not additive.
 *
 * Each palette has a *character* (serene/vivid/crisp/mono) describing its inherent mood.
 * Each style is a *lens* (Engineered/Natural/Expressive/Cinematic) that applies the
 * palette's character with a particular intensity and typographic treatment.
 *
 * The four style lenses:
 *
 *   square   → "Engineered"   — neutral IDE-default, predictable, no chroma scaling,
 *                                comments italic only (the universal IDE convention).
 *   triangle → "Natural"      — optically comfortable, subtle bg warmth, dampened palette
 *                                character. Long-coding-session feel.
 *   circle   → "Expressive"   — palette mood dialed up, chroma scaling at full strength,
 *                                typography reflects palette character.
 *   diamond  → "Cinematic"    — theatrical contrast, amplified character, weighted
 *                                typography matched to palette mood.
 *
 * The (style × character) matrix gives 16 distinct typographic treatments — none feel
 * like an "italic added on for variety", they're each chosen for the lens × mood combo.
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

// ----- per-palette base personality (the "full character" at lens-intensity 1.0) -----

// Background chroma tint — how much the palette hue bleeds into the editor surface
// at full character. Style lens attenuates this.
const BASE_BG_TINTS: Record<PaletteKinds, PersonalityBgTint> = {
  ana: { chromaBoost: 0.018 },
  com: { chromaBoost: 0.030 },
  spl: { chromaBoost: 0.022 },
  tri: { chromaBoost: 0.018 },
  tet: { chromaBoost: 0.014 },
  tas: { chromaBoost: 0.038 },
  ton: { chromaBoost: 0.026 },
}

// Per-palette "full character" contrast profile (mode-aware bg offsets).
// Style lens interpolates from identity (1.0, 1.0, 0, 0) toward this.
const BASE_CONTRAST_PROFILES: Record<PaletteKinds, PersonalityContrastProfile> = {
  // serene: muted, slightly lifted in both modes
  ana: { fgLightnessScale: 0.92, chromaScale: 0.65, bgLightnessOffsetDark: +0.010, bgLightnessOffsetLight: +0.010 },
  tri: { fgLightnessScale: 0.96, chromaScale: 0.72, bgLightnessOffsetDark: +0.012, bgLightnessOffsetLight: +0.012 },
  // vivid: deeper darks, whiter lights (theatrical asymmetry)
  com: { fgLightnessScale: 1.08, chromaScale: 1.40, bgLightnessOffsetDark: -0.020, bgLightnessOffsetLight: +0.010 },
  tet: { fgLightnessScale: 1.06, chromaScale: 1.35, bgLightnessOffsetDark: -0.015, bgLightnessOffsetLight: +0.008 },
  // crisp: structured, modest signature
  spl: { fgLightnessScale: 1.04, chromaScale: 1.20, bgLightnessOffsetDark: -0.005, bgLightnessOffsetLight: +0.005 },
  // mono: moody, both modes lifted slightly toward "haze"
  tas: { fgLightnessScale: 1.05, chromaScale: 0.45, bgLightnessOffsetDark: +0.008, bgLightnessOffsetLight: +0.005 },
  ton: { fgLightnessScale: 0.94, chromaScale: 0.60, bgLightnessOffsetDark: +0.015, bgLightnessOffsetLight: +0.015 },
}

// ----- style lenses (the intensity envelopes) -----

interface StyleLens {
  name: string
  bgChromaIntensity: number     // 0..1.2, multiplier on BASE_BG_TINTS.chromaBoost
  characterIntensity: number    // 0..1.4, multiplier on (BASE_CONTRAST_PROFILES - identity)
  bgOffsetIntensity: number     // 0..1.5, multiplier on bgLightnessOffsetDark/Light
}

const STYLE_LENSES: Record<PaletteStyle, StyleLens> = {
  // Engineered: pure neutrality. The "stock IDE" feel.
  square:   { name: 'Engineered', bgChromaIntensity: 0,    characterIntensity: 0,    bgOffsetIntensity: 0   },
  // Natural: gentle palette tint, dampened character. Optical comfort.
  triangle: { name: 'Natural',    bgChromaIntensity: 0.40, characterIntensity: 0.45, bgOffsetIntensity: 0.35 },
  // Expressive: full palette character. Where the palette's mood speaks.
  circle:   { name: 'Expressive', bgChromaIntensity: 0.85, characterIntensity: 1.00, bgOffsetIntensity: 0.80 },
  // Cinematic: amplified character, theatrical bg. Screenshot-ready.
  diamond:  { name: 'Cinematic',  bgChromaIntensity: 1.10, characterIntensity: 1.25, bgOffsetIntensity: 1.30 },
}

// ----- font-style choices: (style × character) -----
//
// The grid below is deliberately uneven — typography is a *character expression*,
// not a feature ladder. Italics aren't added on diamond for variety; they're picked
// because they support the lens+mood. Plain (no italic) is itself a choice for
// engineered serenity or vivid neutrality.

const FONT_STYLES: Record<PaletteStyle, Record<PaletteCharacter, PersonalityFontStyleProfile>> = {
  square: {
    // Engineered: comment italic is the universal IDE convention. Nothing else added.
    serene: { comments: 'italic', keywords: '' },
    vivid:  { comments: 'italic', keywords: '' },
    crisp:  { comments: 'italic', keywords: '' },
    mono:   { comments: 'italic', keywords: '' },
  },
  triangle: {
    // Natural: comments italic. For mono add types-italic to support the moody character
    // without amplifying loud roles.
    serene: { comments: 'italic', keywords: '' },
    vivid:  { comments: 'italic', keywords: 'italic' },
    crisp:  { comments: 'italic', keywords: '' },
    mono:   { comments: 'italic', keywords: '', types: 'italic' },
  },
  circle: {
    // Expressive: lean into the character.
    serene: { comments: 'italic', keywords: 'italic' },                              // calm + flowing
    vivid:  { comments: 'italic', keywords: 'italic', definitions: 'bold' },         // dramatic + structural
    crisp:  { comments: 'italic', keywords: 'italic' },                              // baseline-strong
    mono:   { comments: 'italic', keywords: 'italic', types: 'italic' },             // heavy italic, moody
  },
  diamond: {
    // Cinematic: full theatrical treatment matched to character.
    serene: { comments: 'italic', keywords: 'italic', definitions: 'bold' },                            // graceful weight
    vivid:  { comments: 'italic', keywords: 'bold italic', definitions: 'bold' },                       // shouted keywords
    crisp:  { comments: 'italic', keywords: 'italic', definitions: 'bold', types: 'italic' },           // structured edge
    mono:   { comments: 'bold italic', keywords: 'italic', types: 'italic', definitions: 'bold' },      // weighted comments — the signature
  },
}

// ----- surface profile: (lens × character) → chrome behavior -----
//
// Lens controls: structural depth (editor L in dark), status bar style, chrome tint
// Character controls: editor whiteness in light mode, peak highlight alpha, cursor
//   source, inactive-selection style, neutral-band warmth.
//
// 2026 is one of several references — diamond runs theatrically deeper, square sits
// closest to a modern Microsoft/2026 baseline, circle/triangle interpolate.

// Editor L in dark mode by lens. Editor is the deepest point; chrome lifts above it.
// Values target the perceptual L range where 2026 / Catppuccin / Dark Modern sit
// (OKLCH L ≈ 0.17–0.21 for the editor surface). Container is L 0.19, so anything
// below that creates the inversion.
const EDITOR_L_DARK_BY_LENS: Record<PaletteStyle, number> = {
  square:   0.230,  // engineered baseline (~VS Code Dark+)
  triangle: 0.245,  // natural — slightly lighter
  circle:   0.230,  // expressive — chrome tint compensates for tight gap
  diamond:  0.195,  // cinematic — theatrical depth, still the darkest lens
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

// Sidebar surface routing. Square keeps the tightest gap; diamond opens it up for drama.
const SIDEBAR_SURFACE_BY_LENS: Record<PaletteStyle, SurfaceProfile['sidebarSurface']> = {
  square:   { dark: 'container', light: 'container' },
  triangle: { dark: 'container', light: 'container' },
  circle:   { dark: 'container', light: 'container' },
  diamond:  { dark: 'container', light: 'containerSunken' },
}

const CHROME_TINT_BY_LENS: Record<PaletteStyle, boolean> = {
  square:   false,
  triangle: false,
  circle:   true,
  diamond:  true,
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
    statusBarStyle:         STATUS_BAR_STYLE_BY_LENS[style],
    cursorSource:           CURSOR_SOURCE_BY_CHARACTER[character],
    inactiveSelectionStyle: INACTIVE_SELECTION_BY_CHARACTER[character],
    neutralBandTint:        NEUTRAL_BAND_TINT_BY_LENS[style],
  }
}

// ----- resolution -----

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function scaledBgTint(base: PersonalityBgTint, intensity: number): PersonalityBgTint | null {
  if (intensity <= 0) return null
  return { chromaBoost: base.chromaBoost * intensity }
}

function scaledContrastProfile(
  base: PersonalityContrastProfile,
  characterIntensity: number,
  bgOffsetIntensity: number,
): PersonalityContrastProfile | null {
  if (characterIntensity <= 0 && bgOffsetIntensity <= 0) return null
  return {
    fgLightnessScale: lerp(1, base.fgLightnessScale, characterIntensity),
    chromaScale: lerp(1, base.chromaScale, characterIntensity),
    bgLightnessOffsetDark: base.bgLightnessOffsetDark * bgOffsetIntensity,
    bgLightnessOffsetLight: base.bgLightnessOffsetLight * bgOffsetIntensity,
  }
}

export function getPersonalityConfig(kind: PaletteKinds, style: PaletteStyle): PersonalityConfig {
  const lens = STYLE_LENSES[style]
  const character = PALETTE_CHARACTER[kind]
  const bgTintBase = BASE_BG_TINTS[kind]
  const profileBase = BASE_CONTRAST_PROFILES[kind]

  return {
    bgTint: scaledBgTint(bgTintBase, lens.bgChromaIntensity),
    contrastProfile: scaledContrastProfile(profileBase, lens.characterIntensity, lens.bgOffsetIntensity),
    fontStyleProfile: FONT_STYLES[style][character],
    surfaceProfile: buildSurfaceProfile(kind, style),
    lensName: lens.name,
    paletteCharacter: character,
  }
}

