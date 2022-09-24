import Color from "colorjs.io";

import {
  adjustHue,
  getLuminance,
  toHex,
  toHsla,
  toRgba,
  readableColor,
} from "color2k";

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
  console.log(r, g, b);
  // r /= 255;
  // g /= 255;
  // b / 255;

  const rL = linearRGB(r);
  const gL = linearRGB(g);
  const bL = linearRGB(b);

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

function colorFactory(colors) {
  // request color names?
  /* {
    palette: 
    colors: []
  }
*/
  return colors.map(({ color, corrected }) => {
    return {
      hex: color.toString({ format: "hex" }),
      rgb: color.to("srgb").toString({ precision: 2 }),
      hsl: color.to("hsl").toString({ precision: 2 }),
      contrastColor:
        color.contrast("black", "wcag21") > color.contrast("white", "wcag21")
          ? "#000"
          : "#fff",
      l: color.lch.l,
      y: y(color.to("srgb")),
      corrected: {
        hex: corrected.toString({ format: "hex" }),
        rgb: corrected.to("srgb").toString({ precision: 2 }),
        hsl: corrected.to("hsl").toString({ precision: 2 }),
        l: corrected.lch.l,
        y: y(corrected.to("srgb")),
        contrastColor:
          corrected.contrast("black", "wcag21") >
          corrected.contrast("white", "wcag21")
            ? "#000"
            : "#fff",
      },
    };
  });
}

function corrector(color, adjustment) {
  const originalColor = new Color(color);
  const newColor = new Color(color);
  newColor.hsl.h += adjustment;
  const [y0] = originalColor.lch;
  const [y1] = newColor.lch;
  const percentChange = y0 - y1;
  newColor.lch.l += percentChange;
  return newColor;
}

function createComplement(hex) {
  const base = new Color(hex);

  console.log({
    hex: hex,
    hue: adjustHue(hex, 180),
    rgb: toRgba(hex),
    hsl: toHsla(hex),
    y: getLuminance(hex),
    contrast: readableColor(hex),
  });

  const complement = new Color(hex);
  complement.hsl.h += 180;

  return colorFactory([
    { color: base, corrected: base },
    { color: complement, corrected: corrector(hex, 180) },
  ]);
}

function createTriad(hex) {
  const base = new Color(hex);
  const triad1 = new Color(hex);
  const triad2 = new Color(hex);
  triad1.hsl.h += 150;
  triad2.hsl.h += 210;

  return colorFactory([
    { color: triad1, corrected: corrector(hex, 150) },
    { color: base, corrected: base },
    { color: triad2, corrected: corrector(hex, 210) },
  ]);
}

function createAdjacent(hex) {
  const base = new Color(hex);
  const adjacent1 = new Color(hex);
  const adjacent2 = new Color(hex);
  adjacent1.hsl.h -= 30;
  adjacent2.hsl.h += 30;

  return colorFactory([
    { color: adjacent1, corrected: corrector(hex, -30) },
    { color: base, corrected: base },
    { color: adjacent2, corrected: corrector(hex, 30) },
  ]);
}

function createTetrad(hex) {
  const base = new Color(hex);
  const tetrad1 = new Color(hex);
  const tetrad2 = new Color(hex);
  const tetrad3 = new Color(hex);

  tetrad1.hsl.h += 90;
  tetrad2.hsl.h += 90 * 2;
  tetrad3.hsl.h += 90 * 3;

  return colorFactory([
    { color: base, corrected: base },
    { color: tetrad1, corrected: corrector(hex, 90) },
    { color: tetrad2, corrected: corrector(hex, 90 * 2) },
    { color: tetrad3, corrected: corrector(hex, 90 * 3) },
  ]);
}

function createMonochromatic(hex) {
  const colors = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    color.hsl.s = 5;
    color.hsl.l = index * 10 + 5;
    colors.push({ color: color, corrected: color });
  }

  return colorFactory(colors);
}

function createShades(hex) {
  const t = new Color(hex);

  const colors = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    // color.hsl.l = 0;
    color.hsl.l = index * 10 + 5;

    colors.push({ color: color, corrected: color });
  }

  return colorFactory(colors);
  const correctedColors = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    const [y] = color.lch;
    const delta = y - color.hsl.l;

    color.hsl.l = y;
    color.hsl.l = index * 10 + 5 + delta;
    correctedColors.push(color);
  }
}

export {
  createComplement,
  createAdjacent,
  createTriad,
  createTetrad,
  createMonochromatic,
  createShades,
};
