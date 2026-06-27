import Color from 'colorjs.io'
import type { PaletteKinds, PaletteStyle } from '../types/types'
import type {
  BaseColorData,
  PaletteCharacter,
  PersonalityConfig,
  PersonalityFontStyleProfile,
  SurfaceProfile,
} from './types'
import { hueSpreadDeg } from './utils'

/**
 * Personality system (palette-primary). After the redesign, color distribution is a property of
 * the generated PALETTE, not a per-kind exemplar: the templates map palette swatches onto roles and
 * the syntax pipeline preserves their hues (see syntax.ts). So the per-kind TOKEN_BANDS (Nord/
 * Dracula L/C envelopes) and ACCENT_ROLES that used to reshape the syntax colors are gone.
 *
 * What remains here: per-style font styles + lens label, and the character-driven "feel" knobs
 * (peak-alpha, cursor, inactive selection, neutral-band tint). Character itself is now *derived*
 * from the palette rather than assigned per kind.
 */

// ----- palette character (derived) -----
//
// Character is the palette's inherent "feel"; it drives the surface knobs below and the description
// prose. A single-hue palette reads mono; otherwise the palette's *overall* (mean) chroma tiers it
// muted → serene, mid → crisp, saturated → vivid. Mean, not peak: nearly every palette has one
// saturated swatch, so peak chroma flattens everything to "vivid" — mean reflects how saturated the
// palette runs as a whole. (Was a hardcoded per-kind map: ana→Nord serene, spl→Dracula vivid, …;
// now it follows the actual colours.)

function deriveCharacter(palette: BaseColorData[], kind: PaletteKinds): PaletteCharacter {
  const chromatic = palette.map(p => p?.color).filter((c): c is Color => !!c && (c.oklch.c ?? 0) > 0.03)
  // Mono: the single-hue kind (tas) or a palette with no real hue spread (achromatic seed).
  const spread = hueSpreadDeg(chromatic.map(c => c.oklch.h ?? 0))
  if (kind === 'tas' || chromatic.length < 2 || spread < 25) return 'mono'
  // Vividness from the palette's overall (mean) chroma.
  const meanC = chromatic.reduce((a, c) => a + (c.oklch.c ?? 0), 0) / chromatic.length
  if (meanC < 0.07) return 'serene'
  if (meanC < 0.12) return 'crisp'
  return 'vivid'
}

// ----- lens label (per style) -----
//
// The style's surface-material name (shown in theme descriptions). The material behavior itself
// lives in ui.ts SURFACE_TREATMENT and reaches code-mode via the surface passthrough.
const LENS_NAMES: Record<PaletteStyle, string> = {
  square: 'Flat',
  triangle: 'Tinted',
  circle: 'Toned',
  diamond: 'Brutalist',
}

// ----- font styles -----
//
// Font styling is a *lens* property only — it never varies by palette character. Exemplar
// consensus: Dark Modern and Nord use no font styles at all; Night Owl, Kanagawa, One Dark,
// Tokyo Night italicize comments only. So square = nothing (the engineered / stock-IDE read);
// triangle / circle / diamond = comments italic, nothing else. No code token is ever italicized.
const FONT_STYLES: Record<PaletteStyle, PersonalityFontStyleProfile> = {
  square: { comments: '' },
  triangle: { comments: 'italic' },
  circle: { comments: 'italic' },
  diamond: { comments: 'italic' },
}

// ----- character-driven "feel" knobs -----

// Peak alpha for the unified chromatic highlight ramp. Light is roughly half of dark —
// primary on white reads much harder than primary on near-black.
const PEAK_ALPHA_BY_CHARACTER: Record<PaletteCharacter, { dark: number; light: number }> = {
  serene: { dark: 0.55, light: 0.25 },
  crisp: { dark: 0.7, light: 0.3 },
  mono: { dark: 0.75, light: 0.32 },
  vivid: { dark: 0.85, light: 0.4 },
}

// Cursor source: loud characters keep accent; calm characters use foreground (2026-style).
const CURSOR_SOURCE_BY_CHARACTER: Record<PaletteCharacter, SurfaceProfile['cursorSource']> = {
  serene: 'foreground',
  mono: 'foreground',
  crisp: 'accent',
  vivid: 'accent',
}

// Inactive selection — when focus leaves, where does identity go?
// Vivid pulls a complementary hue (Night Owl move). Mono falls back to a neutral solid
// since there's no complement to spend. Serene/crisp keep chromatic continuity.
const INACTIVE_SELECTION_BY_CHARACTER: Record<PaletteCharacter, SurfaceProfile['inactiveSelectionStyle']> = {
  serene: 'chromatic',
  crisp: 'chromatic',
  vivid: 'complementary',
  mono: 'neutral',
}

// Diamond warms the neutral band with a whisper of primary; everyone else stays neutral.
const NEUTRAL_BAND_TINT_BY_LENS: Record<PaletteStyle, number> = {
  square: 0,
  triangle: 0,
  circle: 0,
  diamond: 0.15,
}

function buildSurfaceProfile(character: PaletteCharacter, style: PaletteStyle): SurfaceProfile {
  return {
    peakAlpha: PEAK_ALPHA_BY_CHARACTER[character],
    cursorSource: CURSOR_SOURCE_BY_CHARACTER[character],
    inactiveSelectionStyle: INACTIVE_SELECTION_BY_CHARACTER[character],
    neutralBandTint: NEUTRAL_BAND_TINT_BY_LENS[style],
  }
}

// ----- resolution -----

export function getPersonalityConfig(
  kind: PaletteKinds,
  style: PaletteStyle,
  palette: BaseColorData[],
): PersonalityConfig {
  const character = deriveCharacter(palette, kind)
  return {
    fontStyleProfile: FONT_STYLES[style],
    surfaceProfile: buildSurfaceProfile(character, style),
    lensName: LENS_NAMES[style],
    paletteCharacter: character,
  }
}
