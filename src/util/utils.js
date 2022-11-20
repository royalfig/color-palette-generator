export function getRandBetween() {
  return Math.floor(Math.random() * 100) + 1;
}

export function hex3to6(color) {
  const hex = color.toString({ format: "hex" }).substring(1);

  if (hex.length === 3) {
    const [a, b, c] = hex;
    return a + a + b + b + c + c;
  }

  return hex;
}

export function linearRGB(num) {
  if (num > 0.03928) {
    return num + 0.055;
  }

  return num / 12.92;
}

export function y(num) {
  let { r, g, b } = num.srgb;

  // r /= 255;
  // g /= 255;
  // b / 255;

  const rL = linearRGB(r);
  const gL = linearRGB(g);
  const bL = linearRGB(b);

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

export function createSlug(str) {
  return str.split(" ")[0].toLowerCase().replace(/\W/, "-");
}
