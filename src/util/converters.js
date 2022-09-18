import Color from "colorjs.io";

function colorFactory(colors) {
  return colors.map(({ color, corrected }) => ({
    hex: color.toString({}),
    rgb: color.to("srgb").toString({ precision: 2 }),
    hsl: color.to("hsl").toString({ precision: 2 }),
    corrected: {
      hex: corrected.toString({ format: "hex" }),
      rgb: corrected.to("srgb").toString({ precision: 2 }),
      hsl: corrected.to("hsl").toString({ precision: 2 }),
    },
  }));
}

function corrector(color, adjustment) {
  const original = new Color(color);

  const [originalY] = original.lch;

  const adjusted = new Color(original);

  adjusted.hsl.h += adjustment;

  adjusted.lch.l = originalY;

  // console.log(original.hsl, adjusted.hsl);

  const x = new Color(color);
  x.hsl.h += adjustment;

  const corrected = new Color(color);
  const [y] = corrected.lch;
  corrected.hsl.l = y;
  corrected.hsl.h += adjustment;

  return corrected;
}

function createComplement(hex) {
  const base = new Color(hex);
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
