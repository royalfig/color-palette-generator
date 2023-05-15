import { adjustColor } from "./adjustColor";

/**
 * Transforms an array of color objects into a 'languid' color scheme.
 *
 * Each color object is expected to have a `color` property (representing the color) and a `valueToAdjust` property.
 * The `color` is then adjusted by the `valueToAdjust` and mixed with white to create a 'languid' look.
 * The color space for adjustment is OKLCH and the output color space is sRGB.
 *
 * @param {Array.<{color: string, valueToAdjust: number}>} colors - An array of color objects to transform.
 * @returns {Array.<Object>} An array of transformed color objects in sRGB format.
 *
 * @example
 * const colors = [{color: "#FFFFFF", valueToAdjust: 10}, {color: "#000000", valueToAdjust: 20}];
 * const languidColors = makeLanguid(colors);
 */

export function makeLanguid(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);
    adjusted.hsl.s = 50;
    adjusted.lch.l = 75;
    return adjusted;
  });
}
