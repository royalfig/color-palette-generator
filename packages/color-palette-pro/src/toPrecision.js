/**
 * Converts a number to a specified precision.
 *
 * @param {number} n - The number to be converted.
 * @param {number} precision - The desired precision.
 * @returns {number} The number `n` converted to the specified precision.
 *
 * @example
 * returns 12.34
 * toPrecision(12.3456, 4);
 *
 * @example
 * returns 12300
 * toPrecision(12345.6, 3);
 */
export function toPrecision(n, precision) {
  n = +n;
  precision = +precision;
  let integerLength = (Math.floor(n) + "").length;

  if (precision > integerLength) {
    return +n.toFixed(precision - integerLength);
  } else {
    let p10 = 10 ** (integerLength - precision);
    return Math.round(n / p10) * p10;
  }
}
