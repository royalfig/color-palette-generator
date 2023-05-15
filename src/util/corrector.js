import Color from "colorjs.io";

/**
 * Adjusts the hue of a given color in the OKLCH color space.
 *
 * Creates a new Color object from the given color, then increases the hue (`h`) by the given adjustment.
 * The adjustment can be positive or negative.
 *
 * @param {string|Object} color - The color to adjust. This can be a string representing a color, or a Color object.
 * @param {number} adjustment - The amount to adjust the hue by.
 * @returns {Object} A new Color object with the adjusted hue.
 *
 * @example
 * const color = "#FFFFFF";
 * const adjustment = 10;
 * const correctedColor = corrector(color, adjustment);
 */

export function corrector(color, adjustment) {
  const newColor = new Color(color);
  newColor.oklch.h += adjustment;
  return newColor;
}
