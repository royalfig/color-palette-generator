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
