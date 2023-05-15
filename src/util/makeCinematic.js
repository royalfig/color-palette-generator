import { adjustColor } from "./adjustColor";

/**
 * Transforms an array of color objects into a 'cinematic' color scheme.
 *
 * Each color object is expected to have a `color` property (representing the color) and a `valueToAdjust` property.
 * The `color` is then adjusted by the `valueToAdjust` and further transformations are applied to create a 'cinematic' look.
 * - If the lightness (`l`) of the color in HSL format is above 50, it's reduced by half, but not lower than 30.
 * - If the lightness is 50 or below, it's increased by 25%, but not higher than 100.
 * - The saturation (`s`) of the color in HSL format is reduced by half, but not lower than 30.
 *
 * @param {Array.<{color: string, valueToAdjust: number}>} colors - An array of color objects to transform.
 * @returns {Array.<Object>} An array of transformed color objects in HSL format.
 *
 * @example
 * const colors = [{color: "#FFFFFF", valueToAdjust: 10}, {color: "#000000", valueToAdjust: 20}];
 * const cinematicColors = makeCinematic(colors);
 */

export function makeCinematic(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);

    if (adjusted.hsl.l > 50) {
      adjusted.hsl.l = Math.min(30, (adjusted.hsl.l *= 0.5));
    } else {
      adjusted.hsl.l = Math.min(100, (adjusted.hsl.l *= 1.25));
    }

    adjusted.hsl.s = Math.min(30, (adjusted.hsl.s *= 0.5));

    return adjusted;
  });
}
