import Color from "colorjs.io";
import { BaseColorData } from "./factory";
import { paletteModulator } from "./modifiers";
import { generatePalette } from "./palette/generate";
import { generateTintsAndShades } from "./palette/tintsAndShades";
import { ColorFormat, ColorSpace, PaletteKinds } from "./types/types";
import { generateUiColorPalette } from "./ui";

export {
  generateCodeTheme,
  generateCodeThemePair,
  generateTheme,
  generateThemePair,
  serializeTheme,
  serializeThemePair,
} from "./code-mode";
export type { CodeThemeOutput, ThemeFormat } from "./code-mode/types";
export * from "./factory";
export * from "./pickRandomColor";
export * from "./types/types";
export { generateCssVariables } from "./ui/css";
export * from "./utils";

export function createPalettes(
  color: string,
  palette: PaletteKinds,
  style: "square" | "triangle" | "circle" | "diamond",
  colorSpace: { space: ColorSpace; format: ColorFormat },
  modulateValues = [0, 0, 0, 0],
  isUiMode = false,
  isDarkMode = false,
) {
  // tints-and-shades is a single-hue lightness ramp (its own generator); every other kind is a
  // hue-based scheme produced from the declarative tables in palette/schemes.ts.
  const basePalette: BaseColorData[] =
    palette === "tas"
      ? generateTintsAndShades(color, { style, colorSpace })
      : generatePalette(color, palette, { style, colorSpace });

  const modulatedPalette = paletteModulator(basePalette, modulateValues);
  if (isUiMode) {
    // Use the original user color, not the modulated palette color
    return generateUiColorPalette(
      new Color(color),
      modulatedPalette,
      isDarkMode,
      palette,
      colorSpace.format,
      style,
    );
  }
  return modulatedPalette;
}
