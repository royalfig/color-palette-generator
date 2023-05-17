import { toPrecision } from "../util";

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
export function colorFactory(colors, paletteInformation) {
  return colors.map((color, idx) => ({
    code: `${paletteInformation}-${idx + 1}`,
    hex: color.to("srgb").toString({ format: "hex" }),
    rgb: color.to("srgb").toString({ precision: 3 }),
    hsl: color.to("hsl").toString({ precision: 3 }),
    lch: color.to("oklch").toString({ precision: 3 }),
    point: color.hsl,
    contrast:
      color.contrast("black", "wcag21") > color.contrast("white", "wcag21")
        ? "#000"
        : "#fff",
    css: `${paletteInformation}`,
    cssRaw: `${toPrecision(color.to("hsl").h, 2)} ${toPrecision(
      color.to("hsl").s,
      2
    )}% ${toPrecision(color.to("hsl").l, 2)}%`,
  }));
}
