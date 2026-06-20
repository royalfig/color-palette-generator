import { PaletteKinds } from "../types/types";
import { BaseColorData } from "../factory";
import Color from "colorjs.io";

// ===== ACCENT COLOR PREPARATION =====

/**
 * Prepares an accent color (secondary or tertiary) for UI use.
 * Desaturates for better UI integration while retaining some vibrancy from the source.
 */
function prepareAccentColor(
  baseColor: Color,
  role: "secondary" | "tertiary",
): Color {
  const accent = baseColor.clone();

  if (role === "secondary") {
    // Secondary: Muted harmony (Target Chroma ~0.04-0.08)
    accent.oklch.c = Math.min(accent.oklch.c ?? 0, 0.08);
  } else {
    // Tertiary: Vibrant accent (Target Chroma ~0.08-0.12)
    accent.oklch.c = Math.min(accent.oklch.c ?? 0, 0.12);
  }

  return accent;
}

/**
 * Selects secondary and tertiary colors from the palette.
 */
export function selectAccentColors(
  paletteType: PaletteKinds,
  palette: BaseColorData[],
  primary: Color,
): { secondary: Color; tertiary: Color } {
  const safeGetColor = (index: number): Color => {
    if (palette[index]?.color) {
      return palette[index].color.clone();
    }
    const fallback = primary.clone();
    fallback.oklch.h = ((fallback.oklch.h ?? 0) + index * 60) % 360;
    fallback.oklch.c = Math.min((fallback.oklch.c ?? 0) * 0.8, 0.12);
    return fallback;
  };

  let secondaryIndex: number;
  let tertiaryIndex: number;

  switch (paletteType) {
    case "com":
      secondaryIndex = 5; // Muted complement
      tertiaryIndex = 1; // Main complement
      break;
    case "spl":
      secondaryIndex = 3; // Muted split 1
      tertiaryIndex = 4; // Pure split 2
      break;
    case "tri":
      secondaryIndex = 3; // Muted triad hue 2
      tertiaryIndex = 4; // Pure triad hue 3
      break;
    case "tet":
      secondaryIndex = 3; // Muted hue 2
      tertiaryIndex = 4; // Pure hue 3
      break;
    case "ana":
      secondaryIndex = 2; // Subtle analogous shift
      tertiaryIndex = 5; // Distinct analogous accent
      break;
    case "tas": // Tints and shades — pick from the 12-color range
      secondaryIndex = 3; // Deeper shade
      tertiaryIndex = 8; // Lighter tint
      break;
    default:
      secondaryIndex = 1;
      tertiaryIndex = 4;
  }

  return {
    secondary: prepareAccentColor(safeGetColor(secondaryIndex), "secondary"),
    tertiary: prepareAccentColor(safeGetColor(tertiaryIndex), "tertiary"),
  };
}
