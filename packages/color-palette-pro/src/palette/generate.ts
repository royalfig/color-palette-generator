import Color from "colorjs.io";
import { BaseColorData, colorFactory } from "../factory";
import { ColorFormat, ColorSpace, PaletteKinds, PaletteStyle } from "../types/types";
import {
  clampOKLCH,
  DisplayGamut,
  gamutForSpace,
  generateNeutralPalette,
  isAchromatic,
  safeHue,
} from "../utils";
import { SCHEME_SLOTS, SlotSpec, STYLE_SHAPES, StyleShape } from "./schemes";
import { polishSwatch } from "./polish";

type HueScheme = Exclude<PaletteKinds, "tas">;

/** Palette-type string baked into each swatch's `code` (drives CSS var prefixes). */
const CODE: Record<HueScheme, string> = {
  ana: "analogous",
  com: "complementary",
  tri: "triadic",
  tet: "tetradic",
  spl: "split-complementary",
};

// Usable lightness band for derived swatches. Overshoot past these is reflected back inward so a
// very light or very dark base still produces a spread (rather than every slot clipping flat).
const L_MIN = 0.14;
const L_MAX = 0.92;

/**
 * Turn one scheme slot into a realizable color, anchored on the base:
 *   hue  = baseH + hueOffset·hueScale
 *   L    = baseL + dL·lSpread        (reflected into [L_MIN, L_MAX])
 *   C    = baseC · (1 + (cMul−1)·cContrast)
 * then a single gamut-aware OKLCH clamp. This is the one place a derived swatch's L/C/H is decided.
 */
function deriveSwatch(
  base: Color,
  slot: SlotSpec,
  shape: StyleShape,
  gamut: DisplayGamut,
): Color {
  const baseL = base.oklch.l ?? 0.5;
  const baseC = base.oklch.c ?? 0;
  const baseH = safeHue(base, 0);

  const h = baseH + slot.hueOffset * shape.hueScale;

  let l = baseL + slot.dL * shape.lSpread;
  if (l > L_MAX) l = L_MAX - (l - L_MAX); // reflect overshoot back into the band
  if (l < L_MIN) l = L_MIN + (L_MIN - l);
  l = Math.max(L_MIN, Math.min(L_MAX, l)); // safety clamp if the reflection overshot too

  const c = baseC * (1 + (slot.cMul - 1) * shape.cContrast);

  const v = clampOKLCH(l, c, h, gamut);
  const out = base.clone();
  out.oklch.l = v.l;
  out.oklch.c = v.c;
  out.oklch.h = v.h;
  return out;
}

/**
 * Generate a hue-based scheme palette (analogous / complementary / triadic / tetradic /
 * split-complementary) from the declarative tables in schemes.ts. Slot 0 is the user's exact
 * color; the rest are derived per slot. Achromatic seeds fall back to a neutral ramp (a color
 * scheme is meaningless without a hue).
 */
export function generatePalette(
  baseColor: string,
  scheme: HueScheme,
  options: {
    style: PaletteStyle;
    colorSpace: { space: ColorSpace; format: ColorFormat };
  },
): BaseColorData[] {
  const { style, colorSpace } = options;
  const format = colorSpace.format;
  const code = CODE[scheme];

  try {
    const base = new Color(baseColor);
    if (isAchromatic(base)) {
      return generateNeutralPalette(baseColor, 6, code, format);
    }

    const gamut = gamutForSpace(colorSpace.space);
    const slots = SCHEME_SLOTS[scheme];
    const shape = STYLE_SHAPES[style];

    return slots.map((slot, i) =>
      i === 0
        ? colorFactory(baseColor, code, 0, format, true) // base preserved exactly (no polish)
        : colorFactory(
            polishSwatch(deriveSwatch(base, slot, shape, gamut), gamut),
            code,
            i,
            format,
          ),
    );
  } catch (e) {
    throw new Error(`Failed to generate ${code} colors for ${baseColor}: ${e}`);
  }
}
