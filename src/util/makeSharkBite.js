import { adjustColor } from "./adjustColor";

/**
 * Adjusts the hue, saturation, and lightness of an array of color objects.
 *
 * For each color in the input array, this function adjusts the hue by `valueToAdjust`.
 * If the original lightness or saturation is greater than 50, it is reduced to 50% of its original value.
 * If it is less than or equal to 50, the lightness is increased by 50% (up to a maximum of 90), and the saturation is increased by 50% (up to a maximum of 100).
 *
 * @param {Array<{color: string, valueToAdjust: number}>} colors - An array of color objects. Each object should have a `color` property representing the color in any valid CSS color format, and a `valueToAdjust` property representing the value to adjust the hue by.
 * @returns {Array} The array of adjusted color objects. Each object in the array is an adjusted version of the corresponding object in the input array.
 *
 * @example
 * returns [{hsl: {h: adjustedValue, s: adjustedS, l: adjustedL}, ...}, ...]
 * makeSharkBite([{color: '#ff0000', valueToAdjust: 20}, {color: 'rgb(0, 0, 255)', valueToAdjust: 10}]);
 */

export function makeSharkBite(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);

    if (adjusted.hsl.l > 50) {
      console.log(adjusted.hsl.l);
      adjusted.hsl.l = Math.max(0, (adjusted.hsl.l *= 0.5));
    } else {
      adjusted.hsl.l = Math.min((adjusted.hsl.l *= 1.5), 90);
    }

    if (adjusted.hsl.s > 50) {
      adjusted.hsl.s = Math.max(0, (adjusted.hsl.s *= 0.5));
    } else {
      adjusted.hsl.s = Math.min((adjusted.hsl.s *= 1.5), 100);
    }

    return adjusted;
  });
}
