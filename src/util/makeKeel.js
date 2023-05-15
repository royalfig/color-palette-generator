import { corrector } from "./corrector";

/**
 * Transforms an array of color objects by adjusting their hue in the OKLCH color space.
 *
 * Each color object is expected to have a `color` property (representing the color) and a `valueToAdjust` property.
 * The `color` is then adjusted by the `valueToAdjust` using the `corrector` function.
 *
 * @param {Array.<{color: string, valueToAdjust: number}>} colors - An array of color objects to transform.
 * @returns {Array.<Object>} An array of transformed color objects.
 *
 * @example
 * const colors = [{color: "#FFFFFF", valueToAdjust: 10}, {color: "#000000", valueToAdjust: 20}];
 * const keelColors = makeKeel(colors);
 */

export function makeKeel(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    return corrector(color, valueToAdjust);
  });
}
