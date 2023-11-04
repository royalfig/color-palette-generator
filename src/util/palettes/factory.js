import { colorParser } from '../../lib/colorParse.js'

/**
 * Transforms an array of color objects into a comprehensive color palette object.
 *
 * Each color object is transformed into a new object which contains:
 * - A `code` derived from the `paletteInformation` and the color's index in the array.
 * - The color represented in multiple color spaces (sRGB, HSL, OKLCH) as strings.
 * - The color's HSL value as a `point`.
 * - A `contrast` property which determines if the color has higher contrast with black or white according to the WCAG 2.1 guidelines.
 * - A `css` property which is a string representation of the `paletteInformation`.
 * - A `cssRaw` property which is a string representation of the color's HSL value with high precision.
 *
 * @param {Array.<Object>} colors - An array of color objects to transform.
 * @param {string} paletteInformation - A string to use when creating the color code.
 * @returns {Array.<Object>} An array of comprehensive color palette objects.
 *
 * @example
 * const colors = [Color("#FFFFFF"), Color("#000000")];
 * const paletteInformation = "myPalette";
 * const colorPalette = colorFactory(colors, paletteInformation);
 */
export function colorFactory(color, paletteInformation, idx = 0) {
  const { h, s, l } = colorParser.rawHsl(color)

  return {
    code: `${paletteInformation}-${idx + 1}`,
    hex: colorParser.hex(color),
    rgb: colorParser.rgb(color),
    hsl: colorParser.hsl(color),
    lch: colorParser.lch(color),
    oklch: colorParser.oklch(color),
    lab: colorParser.oklab(color),
    oklab: colorParser.oklab(color),
    p3: colorParser.p3(color),
    inGamut: colorParser.inGamut(color),
    point: [h, s * 100],
    //   contrast: colorParser.contrast(color),
    css: `${paletteInformation}`,
    cssRaw: [h, s * 100 + '%', l * 100 + '%'].join(' '),
  }
}
