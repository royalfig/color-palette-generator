import type { PaletteKinds, PaletteStyle } from "../types/types";

const KIND_NAMES: Record<PaletteKinds, { slug: string; displayName: string }> =
  {
    ana: { slug: "analogous", displayName: "Analogous" },
    com: { slug: "complementary", displayName: "Complementary" },
    spl: { slug: "split-complementary", displayName: "Split Complementary" },
    tet: { slug: "tetradic", displayName: "Tetradic" },
    tri: { slug: "triadic", displayName: "Triadic" },
    tas: { slug: "tints-and-shades", displayName: "Tints & Shades" },
  };

const STYLE_NAMES: Record<PaletteStyle, { slug: string; displayName: string }> =
  {
    square: { slug: "square", displayName: "Square" },
    triangle: { slug: "triangle", displayName: "Triangle" },
    circle: { slug: "circle", displayName: "Circle" },
    diamond: { slug: "diamond", displayName: "Diamond" },
  };

/** Distinct name per (kind × style): "Analogous Circle" / "analogous-circle-dark". */
export function themeNames(
  kind: PaletteKinds,
  style: PaletteStyle,
): { dark: string; light: string; displayName: string } {
  const k = KIND_NAMES[kind];
  const s = STYLE_NAMES[style];
  return {
    dark: `${k.slug}-${s.slug}-dark`,
    light: `${k.slug}-${s.slug}-light`,
    displayName: `${k.displayName} ${s.displayName}`,
  };
}
