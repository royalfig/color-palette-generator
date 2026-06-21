import Color from "colorjs.io";
import { BaseColorData, colorFactory } from "./factory";
import { ColorFormat, ColorSpace } from "./types/types";
import { maxChromaFor } from "./ui/colorMath";

export function detectFormat(str: string): "hex" | undefined {
  if (str.startsWith("#")) return "hex";

  // Add more as needed
  return undefined;
}

const OKLCH_LIMITS = {
  l: { min: 0.01, max: 0.99 }, // Avoid pure black/white
};

/** A color is achromatic when chroma is negligible (its hue is then meaningless / NaN). */
export function isAchromatic(color: Color, threshold = 0.002): boolean {
  const c = color.oklch.c ?? 0;
  return (
    !Number.isFinite(c) ||
    c < threshold ||
    !Number.isFinite(color.oklch.h ?? NaN)
  );
}

/**
 * Hue of a color, or `fallback` when the color is achromatic (chroma 0 → NaN hue). Prevents
 * the pervasive `?? 0` bug that silently turned every gray/neutral seed into red (hue 0).
 */
export function safeHue(color: Color, fallback = NaN): number {
  const h = color.oklch.h;
  return Number.isFinite(h ?? NaN) ? (h as number) : fallback;
}

/**
 * The display gamut to keep generated swatches realizable in. sRGB-bound spaces (srgb/hsl) stay
 * sRGB; the wider model/display spaces (p3/oklch/oklab/lch/lab) target P3 — the widest commonly
 * supported display — so P3 screens get richer palettes while sRGB output stays hue-stable.
 */
export type DisplayGamut = "srgb" | "p3";
export function gamutForSpace(space: ColorSpace): DisplayGamut {
  return space === "srgb" || space === "hsl" ? "srgb" : "p3";
}

/**
 * Clamp an OKLCH triple into a safe, *in-gamut* color. Lightness is bounded away from the
 * poles; chroma is reduced to the true per-(L,H) maximum for the target `gamut` (not a flat
 * constant) so the result is realizable without the output stage having to clip and shift its
 * hue. A NaN hue (achromatic) is preserved as NaN with chroma forced to 0.
 */
export function clampOKLCH(
  l: number,
  c: number,
  h: number,
  gamut: DisplayGamut = "srgb",
) {
  const L = Math.max(OKLCH_LIMITS.l.min, Math.min(OKLCH_LIMITS.l.max, l));
  if (!Number.isFinite(h)) {
    return { l: L, c: 0, h: NaN };
  }
  const H = ((h % 360) + 360) % 360;
  const maxC = maxChromaFor(L, H, gamut);
  const C = Math.max(0, Math.min(c, maxC));
  return { l: L, c: C, h: H };
}

export function applyVariation(
  baseColor: Color,
  variation: { l: number; c: number },
  hue: number,
  gamut: DisplayGamut = "srgb",
): Color {
  const values = clampOKLCH(
    (baseColor.oklch.l ?? 0.5) + variation.l,
    (baseColor.oklch.c ?? 0) * variation.c,
    hue,
    gamut,
  );
  const result = baseColor.clone();
  result.oklch.l = values.l;
  result.oklch.c = values.c;
  result.oklch.h = values.h;
  return result;
}

export function getRandBetween() {
  return Math.floor(Math.random() * 100) + 1;
}

export function hex3to6(color: Color) {
  const hex = color.toString({ format: "hex" }).substring(1);

  if (hex.length === 3) {
    const [a, b, c] = hex;
    return a + a + b + b + c + c;
  }

  return hex;
}

export function createSlug(str: string) {
  return str.split(" ")[0].toLowerCase().replace(/\W/, "-");
}

/**
 * Whether a color reads as "light" (i.e. dark text sits better on it than light text).
 * Decided by actual WCAG contrast against black vs white rather than a bare OKLCH L≥0.5
 * threshold — the latter ignores Helmholtz–Kohlrausch (a saturated yellow at L 0.5 reads far
 * lighter than a blue at the same L), mislabeling high-chroma warm colors. (Audit 5.4.)
 */
export function isLight(color: Color) {
  return color.contrastWCAG21("#000") >= color.contrastWCAG21("#fff");
}

export function buildPaletteColors(
  baseColor: string,
  finalColors: Color[],
  paletteType: string,
  format: ColorFormat,
): BaseColorData[] {
  return finalColors.map((color, index) =>
    index === 0
      ? colorFactory(baseColor, paletteType, index, format, true)
      : colorFactory(color, paletteType, index, format),
  );
}

/**
 * Build a neutral (achromatic) palette for an achromatic seed. Color schemes (complement,
 * triad, …) are meaningless when the input has no hue, so instead of silently treating the
 * seed as red (the old `?? 0` behavior) we return a tasteful grayscale ramp that varies in
 * lightness, preserving the user's color at its natural position.
 */
export function generateNeutralPalette(
  baseColor: string,
  count: number,
  paletteType: string,
  format: ColorFormat,
): BaseColorData[] {
  const base = new Color(baseColor);
  const baseL = base.oklch.l ?? 0.5;
  // Even lightness spread across a usable range; the base replaces its nearest slot.
  const lightnesses = Array.from({ length: count }, (_, i) =>
    count === 1 ? baseL : 0.2 + (0.75 * i) / (count - 1),
  );
  let baseSlot = 0;
  let bestDist = Infinity;
  lightnesses.forEach((l, i) => {
    const d = Math.abs(l - baseL);
    if (d < bestDist) {
      bestDist = d;
      baseSlot = i;
    }
  });
  lightnesses[baseSlot] = baseL;

  const colors = lightnesses.map((l) => {
    const c = base.clone();
    c.oklch.l = l;
    c.oklch.c = 0;
    return c;
  });
  // Put the base at index 0 so callers' "index 0 is base" assumption holds.
  [colors[0], colors[baseSlot]] = [colors[baseSlot], colors[0]];
  return buildPaletteColors(baseColor, colors, paletteType, format);
}
