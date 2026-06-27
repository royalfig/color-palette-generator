import Color from 'colorjs.io'
import type { PaletteStyle } from '../types/types'
import type { BaseColorData } from './types'
import { AnsiSlot, ANSI_SLOTS, ANSI_DRIFT_FACTOR, ANSI_CHROMA_FOLLOW_BY_LENS, ANSI_L_SPREAD_BY_LENS } from './constants'
import { ensureAPCAAgainst, clipToSRGB, hueGapDeg } from './utils'

export interface AnsiPalette {
  black: Color
  red: Color
  green: Color
  yellow: Color
  blue: Color
  magenta: Color
  cyan: Color
}

export interface AnsiPaletteInput {
  palette: BaseColorData[]
  /** Convention-placed loud tokens that seed the candidate pool (order matters for ties). */
  tokens: Color[]
  /** UI on-surface, used to derive a lifted near-black. */
  onSurface: Color
  /** Editor background, for the APCA floor. */
  editorBg: Color
  /** Seed-driven chroma centre (see intensity.ts). */
  chromaCentre: number
  style: PaletteStyle
  isDarkMode: boolean
}

/**
 * Resample the seed palette at the six chromatic ANSI positions, with hue, chroma AND
 * lightness all taking cues from the swatch each slot lands on, so the 16 colours have real
 * per-slot texture instead of one flat tone.
 *   hue   — canonical, drifting toward the nearest palette member, bounded by the slot's cap
 *           × the global drift factor (red stays warm for `git diff`; blue is free to become
 *           purple on a purple palette — the Dracula effect — the same in every style).
 *   chroma— the seed-driven centre pulled toward that swatch's own chroma (lens decides how
 *           far): saturated palettes get punchy slots, muted palettes soft ones.
 *   light — a mode band with a hue-natural tilt (yellow/green lift, blue/magenta deepen) plus
 *           a nudge toward the swatch's lightness; lens sets the spread.
 * Everything is gamut-clipped and APCA-floored so the leeway never costs legibility. Black is
 * a lifted near-black (readable `ls`/`git` output that still reads as "black").
 */
export function deriveAnsiPalette(input: AnsiPaletteInput): AnsiPalette {
  const { palette, tokens, onSurface, editorBg, chromaCentre, style, isDarkMode } = input

  const ansiFloor = (c: Color): Color => ensureAPCAAgainst(clipToSRGB(c), editorBg, 45)
  const ansiChromaCentre = chromaCentre
  const ansiDriftFactor = ANSI_DRIFT_FACTOR
  const ansiChromaFollow = ANSI_CHROMA_FOLLOW_BY_LENS[style]
  const ansiLSpread = ANSI_L_SPREAD_BY_LENS[style]
  const ansiLCentre = isDarkMode ? 0.73 : 0.52

  // Candidate pool: the placed syntax tokens + raw palette swatches, so the pull reflects the
  // genuine seed identity (a token may not reach a slot; a swatch can). The palette-swatch gate is
  // RELATIVE to the palette's own peak chroma, not an absolute 0.04: style scales chroma (Phase 0
  // fixes hue but not chroma), and an absolute gate let marginal swatches enter/leave the pool
  // between styles — flipping which swatch a slot snapped toward and so its hue. A relative gate
  // keeps pool membership (and thus ANSI hue) stable across styles. Tokens are style-invariant.
  const paletteMaxC = palette.reduce((m, it) => Math.max(m, it?.color?.oklch.c ?? 0), 0)
  const swatchGate = Math.max(0.02, paletteMaxC * 0.25)
  const ansiPool: Color[] = []
  for (const c of tokens) {
    if ((c.oklch.c ?? 0) >= 0.04) ansiPool.push(c)
  }
  for (const item of palette) {
    const c = item?.color
    if (c && (c.oklch.c ?? 0) >= swatchGate) ansiPool.push(c)
  }
  // Hue-natural lightness tilt: cos peaks at ~100° (yellow-green) and troughs at ~280°
  // (blue-purple). Dark mode lifts the light hues; light mode keeps them in check so
  // intrinsically-bright yellow doesn't lose contrast on white.
  const hueTilt = (h: number): number => Math.cos(((h - 100) * Math.PI) / 180)

  const deriveAnsi = (slot: AnsiSlot): { color: Color } => {
    let nearest: Color | null = null
    let bestGap = Infinity
    // We strictly enforce the theme's identity by always snapping exactly to the
    // nearest available palette color. For Tints & Shades, all slots will map to
    // the single base hue. For Analogous, slots will map to one of the 3 hues.
    for (const c of ansiPool) {
      const g = hueGapDeg(c.oklch.h ?? 0, slot.hue)
      if (g < bestGap) {
        bestGap = g
        nearest = c
      }
    }

    // Fallback just in case pool is empty (shouldn't happen with tokens).
    if (!nearest) nearest = new Color('oklch', [ansiLCentre, ansiChromaCentre, slot.hue])

    const swatchC = nearest.oklch.c ?? ansiChromaCentre
    const swatchL = nearest.oklch.l ?? ansiLCentre

    // Hue: snaps exactly to the nearest palette color without any drift cap.
    const hue = nearest.oklch.h ?? slot.hue

    // Chroma: seed-driven centre pulled toward the swatch's own chroma, then shaped by the slot's
    // hue-natural chroma multiplier so the ramp isn't flat (red/green punchy, yellow/cyan softer).
    const chroma = Math.max(
      Math.max(0.065, ansiChromaCentre * 0.6),
      Math.min(0.24, (ansiChromaCentre + (swatchC - ansiChromaCentre) * ansiChromaFollow) * slot.cScale),
    )

    // Lightness: mode centre + slot's canonical tilt + a nudge toward the swatch's lightness.
    // Using `slot.hue` for the tilt ensures that even if multiple slots snap to the exact same
    // hue (like in Tints & Shades), they still exhibit distinct lightness variations matching
    // their canonical role.
    const tilt = hueTilt(slot.hue) * ansiLSpread * (isDarkMode ? 1 : -0.5)
    const swatchPull = (swatchL - ansiLCentre) * ansiLSpread * 1.2
    const lo = isDarkMode ? 0.55 : 0.32
    const hi = isDarkMode ? 0.95 : 0.72
    const light = Math.max(lo, Math.min(hi, ansiLCentre + tilt + swatchPull))

    return { color: new Color('oklch', [light, chroma, hue]) }
  }

  // Derive in ring order. The collision resolution loop has been removed so that
  // themes with constrained hue palettes (Analogous, Tints & Shades) are free to
  // map terminal slots onto the exact same hues, distinguishing them purely
  // through lightness and chroma variations.
  const ring = [
    deriveAnsi(ANSI_SLOTS.red),
    deriveAnsi(ANSI_SLOTS.yellow),
    deriveAnsi(ANSI_SLOTS.green),
    deriveAnsi(ANSI_SLOTS.cyan),
    deriveAnsi(ANSI_SLOTS.blue),
    deriveAnsi(ANSI_SLOTS.magenta),
  ]

  const [red, yellow, green, cyan, blue, magenta] = ring.map(r => ansiFloor(r.color))

  // ANSI black is conventionally dark in *both* modes (deriving it from onSurface
  // made it near-white in dark themes). A lifted near-black keeps `ls`/`git` output
  // readable against the terminal bg while still reading as "black".
  const black = (() => {
    const c = onSurface.clone()
    c.oklch.c = Math.min((c.oklch.c ?? 0) * 0.3, 0.01)
    c.oklch.l = isDarkMode ? 0.38 : 0.25
    return c
  })()

  return { black, red, green, yellow, blue, magenta, cyan }
}
