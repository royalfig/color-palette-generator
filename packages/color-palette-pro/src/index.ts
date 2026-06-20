import Color from "colorjs.io";
import { BaseColorData } from "./factory";
import { paletteModulator } from "./modifiers";
import { generateAnalogous } from "./palette/analogous";
import { generateComplementary } from "./palette/complementary";
import { generateSplitComplementary } from "./palette/splitcomp";
import { generateTetradic } from "./palette/tetradic";
import { generateTintsAndShades } from "./palette/tintsAndShades";
import { generateTriadic } from "./palette/triadic";
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
  let basePalette: BaseColorData[] = [];

  switch (palette) {
    case "ana":
      basePalette = generateAnalogous(color, { style, colorSpace });
      break;
    case "tri":
      basePalette = generateTriadic(color, { style, colorSpace });
      break;
    case "tet":
      basePalette = generateTetradic(color, { style, colorSpace });
      break;
    case "com":
      basePalette = generateComplementary(color, { style, colorSpace });
      break;
    case "spl":
      basePalette = generateSplitComplementary(color, { style, colorSpace });
      break;
    case "tas":
      basePalette = generateTintsAndShades(color, { style, colorSpace });
      break;
  }

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
