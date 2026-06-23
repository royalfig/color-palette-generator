import Color from "colorjs.io";
import type { PaletteStyle } from "../types/types";
import type { BaseColorData } from "./types";
import {
  AnsiSlot,
  ANSI_SLOTS,
  ANSI_DRIFT_FACTOR,
  ANSI_CHROMA_FOLLOW_BY_LENS,
  ANSI_L_SPREAD_BY_LENS,
} from "./constants";
import { ensureAPCAAgainst, clipToSRGB, hueGapDeg } from "./utils";

export interface AnsiPalette {
  black: Color;
  red: Color;
  green: Color;
  yellow: Color;
  blue: Color;
  magenta: Color;
  cyan: Color;
}

export interface AnsiPaletteInput {
  palette: BaseColorData[];
  /** Convention-placed loud tokens that seed the candidate pool (order matters for ties). */
  tokens: Color[];
  /** UI on-surface, used to derive a lifted near-black. */
  onSurface: Color;
  /** Editor background, for the APCA floor. */
  editorBg: Color;
  /** Seed-driven chroma centre (see intensity.ts). */
  chromaCentre: number;
  style: PaletteStyle;
  isDarkMode: boolean;
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
  const {
    palette,
    tokens,
    onSurface,
    editorBg,
    chromaCentre,
    style,
    isDarkMode,
  } = input;

  const ansiFloor = (c: Color): Color =>
    ensureAPCAAgainst(clipToSRGB(c), editorBg, 45);
  const ansiChromaCentre = chromaCentre;
  const ansiDriftFactor = ANSI_DRIFT_FACTOR;
  const ansiChromaFollow = ANSI_CHROMA_FOLLOW_BY_LENS[style];
  const ansiLSpread = ANSI_L_SPREAD_BY_LENS[style];
  const ansiLCentre = isDarkMode ? 0.73 : 0.52;

  // Candidate pool: the placed syntax tokens + raw palette swatches, so the pull reflects the
  // genuine seed identity (a token may not reach a slot; a swatch can). The palette-swatch gate is
  // RELATIVE to the palette's own peak chroma, not an absolute 0.04: style scales chroma (Phase 0
  // fixes hue but not chroma), and an absolute gate let marginal swatches enter/leave the pool
  // between styles — flipping which swatch a slot snapped toward and so its hue. A relative gate
  // keeps pool membership (and thus ANSI hue) stable across styles. Tokens are style-invariant.
  const paletteMaxC = palette.reduce(
    (m, it) => Math.max(m, it?.color?.oklch.c ?? 0),
    0,
  );
  const swatchGate = Math.max(0.03, paletteMaxC * 0.4);
  const ansiPool: Color[] = [];
  for (const c of tokens) {
    if ((c.oklch.c ?? 0) >= 0.04) ansiPool.push(c);
  }
  for (const item of palette) {
    const c = item?.color;
    if (c && (c.oklch.c ?? 0) >= swatchGate) ansiPool.push(c);
  }
  // Hue-natural lightness tilt: cos peaks at ~100° (yellow-green) and troughs at ~280°
  // (blue-purple). Dark mode lifts the light hues; light mode keeps them in check so
  // intrinsically-bright yellow doesn't lose contrast on white.
  const hueTilt = (h: number): number => Math.cos(((h - 100) * Math.PI) / 180);

  // Only echo the palette where it actually *has* a colour near the slot; if the nearest
  // member is further than this window the palette has nothing in that family, so we
  // synthesise a clean canonical colour rather than chase a distant hue (which is what
  // made cyan collapse into green on a green-dominant palette).
  const ANSI_ECHO_WINDOW = 58;
  const deriveAnsi = (slot: AnsiSlot): { color: Color; canon: number } => {
    let nearest: Color | null = null;
    let bestGap = Infinity;
    for (const c of ansiPool) {
      const g = hueGapDeg(c.oklch.h ?? 0, slot.hue);
      if (g < bestGap) {
        bestGap = g;
        nearest = c;
      }
    }
    const echo = nearest !== null && bestGap <= ANSI_ECHO_WINDOW;
    const swatchC = echo
      ? (nearest!.oklch.c ?? ansiChromaCentre)
      : ansiChromaCentre;
    const swatchL = echo ? (nearest!.oklch.l ?? ansiLCentre) : ansiLCentre;

    // Hue: drift toward the swatch (only when echoing), bounded by cap × the global drift factor.
    let hue = slot.hue;
    if (echo) {
      const cap = slot.drift * ansiDriftFactor;
      const signed =
        (((nearest!.oklch.h ?? slot.hue) - slot.hue + 540) % 360) - 180;
      hue = (slot.hue + Math.max(-cap, Math.min(cap, signed)) + 360) % 360;
    }

    // Chroma: seed-driven centre pulled toward the swatch's own chroma, then shaped by the slot's
    // hue-natural chroma multiplier so the ramp isn't flat (red/green punchy, yellow/cyan softer).
    const chroma = Math.max(
      0.05,
      Math.min(
        0.24,
        (ansiChromaCentre + (swatchC - ansiChromaCentre) * ansiChromaFollow) *
          slot.cScale,
      ),
    );

    // Lightness: mode centre + hue-natural tilt + a nudge toward the swatch's lightness.
    const tilt = hueTilt(hue) * ansiLSpread * (isDarkMode ? 1 : -0.5);
    const swatchPull = echo ? (swatchL - ansiLCentre) * ansiLSpread * 1.2 : 0;
    const lo = isDarkMode ? 0.58 : 0.4;
    const hi = isDarkMode ? 0.9 : 0.66;
    const light = Math.max(lo, Math.min(hi, ansiLCentre + tilt + swatchPull));

    return { color: new Color("oklch", [light, chroma, hue]), canon: slot.hue };
  };

  // Derive in ring order, then guarantee a minimum hue separation so no two slots
  // collide (e.g. a stylised cyan creeping into green). Colliding pairs are resolved
  // by pulling whichever drifted *further* from its canonical hue back toward it —
  // always safe, since the canonical hues are ≥50° apart.
  const ANSI_MIN_GAP = 22;
  const ring = [
    deriveAnsi(ANSI_SLOTS.red),
    deriveAnsi(ANSI_SLOTS.yellow),
    deriveAnsi(ANSI_SLOTS.green),
    deriveAnsi(ANSI_SLOTS.cyan),
    deriveAnsi(ANSI_SLOTS.blue),
    deriveAnsi(ANSI_SLOTS.magenta),
  ];
  const signedTo = (from: number, to: number): number =>
    ((to - from + 540) % 360) - 180;
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      const ah = a.color.oklch.h ?? 0,
        bh = b.color.oklch.h ?? 0;
      const gap = (bh - ah + 360) % 360; // forward distance a→b around the ring
      const fwd = gap > 180 ? 360 - gap : gap;
      if (fwd < ANSI_MIN_GAP) {
        // Push BOTH toward their own canonical hue (which lies away from the collision,
        // since they only collide by drifting toward each other) — resolves a slot
        // squeezed between two neighbours that pulling one alone would oscillate on.
        const half = (ANSI_MIN_GAP - fwd) / 2 + 0.3;
        a.color.oklch.h =
          (ah + (Math.sign(signedTo(ah, a.canon)) || -1) * half + 360) % 360;
        b.color.oklch.h =
          (bh + (Math.sign(signedTo(bh, b.canon)) || 1) * half + 360) % 360;
        moved = true;
      }
    }
    if (!moved) break;
  }

  const [red, yellow, green, cyan, blue, magenta] = ring.map((r) =>
    ansiFloor(r.color),
  );

  // ANSI black is conventionally dark in *both* modes (deriving it from onSurface
  // made it near-white in dark themes). A lifted near-black keeps `ls`/`git` output
  // readable against the terminal bg while still reading as "black".
  const black = (() => {
    const c = onSurface.clone();
    c.oklch.c = Math.min((c.oklch.c ?? 0) * 0.3, 0.01);
    c.oklch.l = isDarkMode ? 0.38 : 0.25;
    return c;
  })();

  return { black, red, green, yellow, blue, magenta, cyan };
}
