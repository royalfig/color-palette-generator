import type { PaletteKinds, PaletteStyle } from "../types/types";
import type { PaletteCharacter } from "./types";

// Theme naming + human-readable descriptions. The slug/displayName per (kind × style)
// drives file names and the theme picker label; the prose description is shown in the
// VSCode/Zed theme metadata.

const KIND_NAMES: Record<PaletteKinds, { slug: string; displayName: string }> =
  {
    ana: { slug: "analogous", displayName: "Analogous" },
    com: { slug: "complementary", displayName: "Complementary" },
    spl: { slug: "split-complementary", displayName: "Split Complementary" },
    tet: { slug: "tetradic", displayName: "Tetradic" },
    tri: { slug: "triadic", displayName: "Triadic" },
    tas: { slug: "tints-and-shades", displayName: "Tints & Shades" },
    ton: { slug: "tones", displayName: "Tones" },
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

const CHARACTER_PROSE: Record<PaletteCharacter, string> = {
  serene: "calm and balanced",
  vivid: "high-contrast and dramatic",
  crisp: "structured and medium-energy",
  mono: "monochromatic and moody",
};

export function buildDescription(
  displayName: string,
  lensName: string,
  character: PaletteCharacter,
  isDarkMode: boolean,
): string {
  const mode = isDarkMode ? "dark" : "light";
  return `${displayName} in the ${lensName} lens — a ${CHARACTER_PROSE[character]} ${mode} theme generated from a ${displayName.toLowerCase()} palette.`;
}
