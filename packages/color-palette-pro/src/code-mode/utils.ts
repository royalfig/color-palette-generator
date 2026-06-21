import Color from "colorjs.io";
import { findColorByHue } from "../ui/colorMath";
import {
  toHex,
  withAlpha,
  mix,
  deltaE,
  hueGapDeg,
  shiftHue,
  desaturate,
  boostChroma,
} from "../color/oklch";

// Shared OKLCH/format primitives now live in color/oklch.ts (colorjs-backed). They're re-exported
// here — alongside the palette-search helper from ui/colorMath — so existing code-mode imports
// from "./utils" keep working. What remains *defined* in this file is the code-mode-specific
// pipeline machinery: APCA contrast control, gamut clipping, and the distinction nudges.
export {
  findColorByHue,
  toHex,
  withAlpha,
  deltaE,
  hueGapDeg,
  shiftHue,
  desaturate,
  boostChroma,
};
export { mix as mixColors };

/**
 * Clamp/adapt OKLCH lightness (L) for AAA text legibility while preserving hue and chroma.
 * Legibility ranges: 0.75-0.90 for dark mode, 0.20-0.45 for light mode.
 */
export function adaptLightnessForText(color: Color, isDarkMode: boolean): Color {
  const c = color.clone();
  if (isDarkMode) {
    c.oklch.l = Math.max(0.75, Math.min(0.9, c.oklch.l ?? 0.5));
  } else {
    c.oklch.l = Math.max(0.2, Math.min(0.45, c.oklch.l ?? 0.5));
  }
  return c;
}

/**
 * Adapt a "quiet" role: keeps L in a tighter, less prominent band than primary syntax.
 * Used for variables, properties, operators, punctuation — high-frequency tokens that
 * shouldn't compete with definitions/keywords/strings.
 */
export function adaptLightnessForQuiet(
  color: Color,
  isDarkMode: boolean,
): Color {
  const c = color.clone();
  if (isDarkMode) {
    c.oklch.l = Math.max(0.62, Math.min(0.82, c.oklch.l ?? 0.5));
  } else {
    c.oklch.l = Math.max(0.3, Math.min(0.55, c.oklch.l ?? 0.5));
  }
  return c;
}

/**
 * Tint a neutral color toward a hue. Used to derive quiet roles (variable, property)
 * from onSurfaceVariant so they carry a whiff of palette identity without competing.
 */
export function tintTowardHue(
  neutral: Color,
  towardHue: number,
  hueAmount = 1.0,
  chromaAdd = 0.012,
): Color {
  const c = neutral.clone();
  c.oklch.h = towardHue;
  c.oklch.c = Math.min(
    0.06,
    (c.oklch.c ?? 0) + chromaAdd * Math.max(0, Math.min(1, hueAmount)),
  );
  return c;
}

/**
 * Binary-search for the L value that minimally satisfies an APCA contrast target.
 * APCA returns Lc (positive = light fg on dark bg, negative = dark fg on light bg).
 * We compare |Lc| against minLc.
 *
 * APCA targets (Bronze readability):
 *  - 75: body text
 *  - 60: fluent text / large body
 *  - 45: incidental UI text
 *  - 30: spot text / decorative
 */
function findOptimalLightnessAPCA(
  color: Color,
  background: Color,
  minLc: number,
): Color {
  const bgL = background.oklch.l ?? 0.5;
  const needLightForeground = bgL < 0.5;

  let minL = 0;
  let maxL = 1;
  let bestColor = color.clone();
  let bestLc = Math.abs(color.contrastAPCA(background));

  for (let i = 0; i < 22; i++) {
    const testL = (minL + maxL) / 2;
    const test = color.clone();
    test.oklch.l = testL;
    const lc = Math.abs(test.contrastAPCA(background));

    if (lc >= minLc) {
      bestColor = test.clone();
      bestLc = lc;
      if (needLightForeground) maxL = testL;
      else minL = testL;
    } else {
      if (needLightForeground) minL = testL;
      else maxL = testL;
    }
    if (Math.abs(maxL - minL) < 0.0001) break;
  }
  // If we never reached the target, return the best we found (closest to target).
  return bestLc >= minLc
    ? bestColor
    : (() => {
        // fall back: push to gamut extremes
        const fb = color.clone();
        fb.oklch.l = needLightForeground ? 0.98 : 0.02;
        return fb;
      })();
}

/**
 * Like ensureContrastAgainst, but using APCA (perception-aligned). Returns the
 * original color if it already meets the target Lc.
 */
export function ensureAPCAAgainst(color: Color, bg: Color, minLc: number): Color {
  if (Math.abs(color.contrastAPCA(bg)) >= minLc) return color.clone();
  return findOptimalLightnessAPCA(color, bg, minLc);
}

/**
 * Clip a color to the sRGB gamut and return it in OKLCH. Pipeline math (band
 * normalization, distinction nudges) must operate on realizable colors — otherwise
 * two distinct OKLCH values can collapse to near-identical hex at serialization.
 */
export function clipToSRGB(color: Color): Color {
  const srgb = color.clone().to("srgb");
  if (!srgb) return color.clone();
  return srgb.toGamut().to("oklch");
}

/**
 * Cap a color's contrast against a background: if |Lc| exceeds maxLc, walk L toward
 * the background until it drops under. Used to keep comments *recessed* — the
 * exemplar themes run comments at Lc 18–41, well below body-text contrast.
 */
export function capAPCAAgainst(color: Color, bg: Color, maxLc: number): Color {
  if (Math.abs(color.contrastAPCA(bg)) <= maxLc) return color.clone();
  const bgL = bg.oklch.l ?? 0.5;
  let lo = Math.min(color.oklch.l ?? 0.5, bgL);
  let hi = Math.max(color.oklch.l ?? 0.5, bgL);
  const fgIsLighter = (color.oklch.l ?? 0.5) >= bgL;
  let best = color.clone();
  for (let i = 0; i < 20; i++) {
    const testL = (lo + hi) / 2;
    const test = color.clone();
    test.oklch.l = testL;
    if (Math.abs(test.contrastAPCA(bg)) <= maxLc) {
      best = test;
      // under the cap — try moving back toward the original L for max legibility
      if (fgIsLighter) lo = testL;
      else hi = testL;
    } else {
      if (fgIsLighter) hi = testL;
      else lo = testL;
    }
    if (hi - lo < 0.0005) break;
  }
  return best;
}

/**
 * Lightness-based distinction nudge: instead of rotating hue (which would break the palette's
 * hue geometry — the whole point of the palette-primary model), step L away from the collision
 * and add a whisper of chroma. The Kanagawa/Poimandres strategy, now used for every kind so two
 * too-close roles separate by tier rather than by leaving the palette's hues.
 */
export function nudgeLightnessForDistinction(
  color: Color,
  awayFrom: Color,
  isDarkMode: boolean,
  step = 0.07,
): Color {
  const cl = color.oklch.l ?? 0.5;
  const [lMin, lMax] = isDarkMode ? [0.64, 0.92] : [0.36, 0.66];
  const candidate = (l: number): Color => {
    const c = color.clone();
    c.oklch.l = l;
    // a whisper of extra chroma still helps separate without leaving the hue family
    c.oklch.c = Math.min(0.16, (c.oklch.c ?? 0) + 0.01);
    return clipToSRGB(c);
  };
  // Evaluate both directions by *post-gamut* ΔE — stepping blindly "away" from the
  // anchor can pin the color against a band edge where the clamp makes it a no-op.
  const up = candidate(Math.min(lMax, cl + step));
  const down = candidate(Math.max(lMin, cl - step));
  return deltaE(up, awayFrom) >= deltaE(down, awayFrom) ? up : down;
}

/**
 * Brighten (dark mode) or dim (light mode) an ANSI color for its bright variant.
 * Mirrors the formula used in deriveUiColors so terminal outputs stay consistent.
 */
export function brightAnsiHex(
  hex: string,
  isDarkMode: boolean,
  isBlack = false,
): string {
  const c = new Color(hex);
  c.oklch.l = Math.min(
    0.95,
    (c.oklch.l ?? 0.5) + (isDarkMode ? (isBlack ? 0.2 : 0.1) : -0.05),
  );
  return toHex(c);
}

/**
 * Bright white (ANSI 15) from white (ANSI 7). White already sits near the lightness
 * ceiling, so the flat +L lift brightAnsiHex applies to the chromatic slots clips to no
 * visible change. In dark mode, push toward pure white instead — climb past the ceiling
 * and shed a step of the bg-hue tint — so bold/bright text lifts a notch above body text
 * (the Tokyo Night / Gruvbox / Dracula pattern). Light mode keeps the standard dim.
 */
export function brightWhiteHex(hex: string, isDarkMode: boolean): string {
  if (!isDarkMode) return brightAnsiHex(hex, isDarkMode);
  const c = new Color(hex);
  c.oklch.l = Math.min(1, Math.max(c.oklch.l ?? 0.95, 0.985));
  c.oklch.c = (c.oklch.c ?? 0) * 0.35;
  return toHex(c);
}

/**
 * Dim ANSI (the 8 dim_* slots) from a base ANSI color: a reduced-intensity variant.
 * Drop a step of lightness and pull chroma in — exported Zed themes seat dim a notch
 * deeper than the base in both light and dark, so darken regardless of mode.
 */
export function dimAnsiHex(hex: string): string {
  const c = new Color(hex);
  c.oklch.l = Math.max(0, (c.oklch.l ?? 0.5) - 0.12);
  c.oklch.c = (c.oklch.c ?? 0) * 0.8;
  return toHex(c);
}
