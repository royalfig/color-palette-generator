import Color from "colorjs.io";

/**
 * Adjusts a color's hue, saturation, or lightness.
 *
 * @param {string} hex - The color to be adjusted, represented as a hex string.
 * @param {string} valueToAdjust - The property of the color to adjust. Should be 'h', 's', or 'l' for hue, saturation, or lightness, respectively.
 * @param {number} adjustment - The amount by which to adjust the color.
 * @param {string} operator - The mathematical operation to use for the adjustment. Can be 'divide', 'minus', 'times', or any other string for addition.
 * @returns {Color} The adjusted color.
 *
 * @example
 * returns a Color object with the hue increased by 20
 * adjustColor('#ff0000', 'h', 20);
 *
 * @example
 * returns a Color object with the saturation decreased by 0.1
 * adjustColor('rgb(255, 0, 0)', 's', 0.1, 'minus');
 *
 * @example
 * returns a Color object with the lightness multiplied by 0.5
 * adjustColor('rgb(255, 0, 0)', 'l', 0.5, 'times');
 */

export function adjustColor(hex, valueToAdjust, adjustment, operator) {
  const color = new Color(hex);

  switch (operator) {
    case "divide":
      color.hsl[valueToAdjust] /= adjustment;
      break;
    case "minus":
      color.hsl[valueToAdjust] -= adjustment;
      break;
    case "times":
      color.hsl[valueToAdjust] *= adjustment;
      break;
    default:
      color.hsl[valueToAdjust] += adjustment;
  }

  return color;
}
