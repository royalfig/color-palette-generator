import type { PaletteKinds, PaletteStyle } from '../types'
import type {
  PaletteCharacter,
  PersonalityBgTint,
  PersonalityConfig,
  PersonalityContrastProfile,
  PersonalityFontStyleProfile,
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
    lensName: lens.name,
    paletteCharacter: character,
  }
}

export function getPaletteCharacter(kind: PaletteKinds): PaletteCharacter {
  return PALETTE_CHARACTER[kind]
}

export function getLensName(style: PaletteStyle): string {
  return STYLE_LENSES[style].name
}
