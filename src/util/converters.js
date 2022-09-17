import Color from "colorjs.io";

function createComplement(hex) {
  const base = new Color(hex);
  const complement = new Color(hex);
  const corrected = new Color(hex);

  const [y] = corrected.lch;
  corrected.hsl.l = y;
  corrected.hsl.h += 180;

  complement.hsl.h += 180;

  return {
    base: {
      hex: base.toString({ format: "hex" }),
      rgb: base.to("srgb").toString({ precision: 2 }),
      hsl: base.to("hsl").toString({ precision: 2 }),
      corrected: {
        hex: base.toString({ format: "hex" }),
        rgb: base.to("srgb").toString({ precision: 2 }),
        hsl: base.to("hsl").toString({ precision: 2 }),
      },
    },
    complement: {
      hex: complement.toString({ format: "hex" }),
      rgb: complement.to("srgb").toString({ precision: 2 }),
      hsl: complement.to("hsl").toString({ precision: 2 }),
      corrected: {
        hex: corrected.toString({ format: "hex" }),
        rgb: corrected.to("srgb").toString({ precision: 2 }),
        hsl: corrected.to("hsl").toString({ precision: 2 }),
      },
    },
  };
}

function createTriad(hex) {
  const base = new Color(hex);
  const triad1 = new Color(hex);
  const triad2 = new Color(hex);

  triad1.hsl.h += 150;
  triad2.hsl.h += 210;

  return {
    triad1: {
      hex: triad1.toString({ format: "hex" }),
      rgb: triad1.to("srgb").toString({ precision: 2 }),
      hsl: triad1.to("hsl").toString({ precision: 2 }),
    },
    base: {
      hex: base.toString({ format: "hex" }),
      rgb: base.to("srgb").toString({ precision: 2 }),
      hsl: base.to("hsl").toString({ precision: 2 }),
    },
    triad2: {
      hex: triad2.toString({ format: "hex" }),
      rgb: triad2.to("srgb").toString({ precision: 2 }),
      hsl: triad2.to("hsl").toString({ precision: 2 }),
    },
  };
}

function createAdjacent(hex) {
  const base = new Color(hex);
  const adjacent1 = new Color(hex);
  const adjacent2 = new Color(hex);

  adjacent1.hsl.h -= 30;
  adjacent2.hsl.h += 30;

  return {
    adjacent1: {
      hex: adjacent1.toString({ format: "hex" }),
      rgb: adjacent1.to("srgb").toString({ precision: 2 }),
      hsl: adjacent1.to("hsl").toString({ precision: 2 }),
    },
    base: {
      hex: base.toString({ format: "hex" }),
      rgb: base.to("srgb").toString({ precision: 2 }),
      hsl: base.to("hsl").toString({ precision: 2 }),
    },
    adjacent2: {
      hex: adjacent2.toString({ format: "hex" }),
      rgb: adjacent2.to("srgb").toString({ precision: 2 }),
      hsl: adjacent2.to("hsl").toString({ precision: 2 }),
    },
  };
}

function createTetrad(hex) {
  const base = new Color(hex);
  const tetrad1 = new Color(hex);
  const tetrad2 = new Color(hex);
  const tetrad3 = new Color(hex);

  tetrad1.hsl.h += 90;
  tetrad2.hsl.h += 90 * 2;
  tetrad3.hsl.h += 90 * 3;

  return {
    base: {
      hex: base.toString({ format: "hex" }),
      rgb: base.to("srgb").toString({ precision: 2 }),
      hsl: base.to("hsl").toString({ precision: 2 }),
    },
    tetrad1: {
      hex: tetrad1.toString({ format: "hex" }),
      rgb: tetrad1.to("srgb").toString({ precision: 2 }),
      hsl: tetrad1.to("hsl").toString({ precision: 2 }),
    },
    tetrad2: {
      hex: tetrad2.toString({ format: "hex" }),
      rgb: tetrad2.to("srgb").toString({ precision: 2 }),
      hsl: tetrad2.to("hsl").toString({ precision: 2 }),
    },
    tetrad3: {
      hex: tetrad3.toString({ format: "hex" }),
      rgb: tetrad3.to("srgb").toString({ precision: 2 }),
      hsl: tetrad3.to("hsl").toString({ precision: 2 }),
    },
  };
}

function createMonochromatic(hex) {}

function createShades(hex) {}

export {
  createComplement,
  createAdjacent,
  createTriad,
  createTetrad,
  createMonochromatic,
  createShades,
};
