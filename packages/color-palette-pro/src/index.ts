import Color from 'colorjs.io'
import { BaseColorData } from './factory'
import { paletteModulator } from './modifiers'
import { generatePalette } from './palette/generate'
import { generateTintsAndShades } from './palette/tintsAndShades'
import { ColorFormat, ColorSpace, PaletteKinds, PaletteStyle } from './types/types'
import { generateUiColorPalette } from './ui'

export {
  generateCodeTheme,
  generateCodeThemePair,
  generateTheme,
  generateThemePair,
  serializeTheme,
  serializeThemePair,
} from './code-mode'
export type { CodeThemeOutput, ThemeFormat } from './code-mode/types'
export { colorFactory } from './factory'
export type { BaseColorData } from './factory'
export { pickRandomColor } from './pickRandomColor'
export type { ColorFormat, ColorSpace, ColorSpaceAndFormat, PaletteKinds, PaletteStyle, SliderType } from './types/types'
export { generateCssVariables } from './ui/css'

export interface CreatePalettesOptions {
  /** The base color as a string (e.g., hex or rgb). */
  color: string;
  /** The kind of palette to generate (e.g., 'ana' for analogous, 'com' for complementary). */
  palette: PaletteKinds;
  /** The style profile of the palette (affects tone and contrast). */
  style: PaletteStyle;
  /** The color space and output format settings. */
  colorSpace: { space: ColorSpace; format: ColorFormat };
  /** Array of 4 values to modulate [hue, saturation, lightness, alpha]. Defaults to [0, 0, 0, 0]. */
  modulateValues?: [number, number, number, number];
  /** Whether to generate a semantic UI palette (true) or a raw token palette (false). */
  isUiMode?: boolean;
  /** Whether to generate colors optimized for a dark mode surface (only applies if isUiMode is true). */
  isDarkMode?: boolean;
}

/**
 * Generates a complete mathematical color palette based on a seed color.
 * 
 * @param options - Configuration options for the palette generation.
 * @returns An array of generated color data objects.
 */
export function createPalettes(options: CreatePalettesOptions): BaseColorData[] {
  const {
    color,
    palette,
    style,
    colorSpace,
    modulateValues = [0, 0, 0, 0],
    isUiMode = false,
    isDarkMode = false,
  } = options;

  // tints-and-shades is a single-hue lightness ramp (its own generator); every other kind is a
  // hue-based scheme produced from the declarative tables in palette/schemes.ts.
  const basePalette: BaseColorData[] =
    palette === 'tas'
      ? generateTintsAndShades(color, { style, colorSpace })
      : generatePalette(color, palette, { style, colorSpace });

  const modulatedPalette = paletteModulator(basePalette, modulateValues);
  
  if (isUiMode) {
    // Use the original user color, not the modulated palette color
    return generateUiColorPalette(new Color(color), modulatedPalette, isDarkMode, palette, colorSpace.format, style);
  }
  return modulatedPalette;
}
