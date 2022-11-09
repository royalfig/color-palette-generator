import Color from "colorjs.io";

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

function colorFactory(colors) {
  // request color names?
  /* {
    palette: 
    colors: []
  }
*/
  return colors.map(({ color, corrected, name, css }) => {
    return {
      name,
      hex: color.toString({ format: "hex" }),
      rgb: color.to("srgb").toString({ precision: 2 }),
      hsl: color.to("hsl").toString({ precision: 2 }),
      lch: color.to("lch").toString({ precision: 2 }),
      contrast:
        color.contrast("black", "wcag21") > color.contrast("white", "wcag21")
          ? "#000"
          : "#fff",
      l: color.lch.l,
      y: y(color.to("srgb")),
      point: color.hsl,
      css,
      corrected: {
        name,
        hex: corrected.toString({ format: "hex" }),
        rgb: corrected.to("srgb").toString({ precision: 2 }),
        hsl: corrected.to("hsl").toString({ precision: 2 }),
        lch: corrected.to("lch").toString({ precision: 2 }),
        l: corrected.lch.l,
        y: y(corrected.to("srgb")),
        point: color.hsl,
        contrast:
          corrected.contrast("black", "wcag21") >
          corrected.contrast("white", "wcag21")
            ? "#000"
            : "#fff",
        css,
      },
    };
  });
}

function corrector(color, adjustment) {
  const originalColor = new Color(color);
  const newColor = new Color(color);
  newColor.lch.h += adjustment;

  return newColor;
}

function createComplement(hex) {
  const base = new Color(hex);

  const complement = new Color(hex);
  complement.hsl.h += 180;

  return colorFactory([
    { color: base, corrected: base, name: "Complementary", css: "comp-1" },
    {
      color: complement,
      corrected: corrector(hex, 180),
      name: "Complementary",
      css: "comp-2",
    },
  ]);
}

function createSplit(hex) {
  const base = new Color(hex);
  const triad1 = new Color(hex);
  const triad2 = new Color(hex);
  triad1.hsl.h += 150;
  triad2.hsl.h += 210;

  return colorFactory([
    {
      color: triad1,
      corrected: corrector(hex, 150),
      name: "Split Complementary",
      css: "split-1",
    },
    {
      color: base,
      corrected: base,
      name: "Split Complementary",
      css: "split-1",
    },
    {
      color: triad2,
      corrected: corrector(hex, 210),
      name: "Split Complementary",
      css: "split-1",
    },
  ]);
}

function createTriad(hex) {
  const base = new Color(hex);
  const triad1 = new Color(hex);
  const triad2 = new Color(hex);
  triad1.hsl.h += 120;
  triad2.hsl.h += 240;

  return colorFactory([
    {
      color: triad1,
      corrected: corrector(hex, 120),
      name: "Triadic",
      css: "triadic-1",
    },
    { color: base, corrected: base, name: "Triadic", css: "tradic-2" },
    {
      color: triad2,
      corrected: corrector(hex, 240),
      name: "Triadic",
      css: "triadic-3",
    },
  ]);
}

function createAdjacent(hex) {
  const base = new Color(hex);
  const adjacent1 = new Color(hex);
  const adjacent2 = new Color(hex);
  adjacent1.hsl.h -= 30;
  adjacent2.hsl.h += 30;

  return colorFactory([
    {
      color: adjacent1,
      corrected: corrector(hex, -30),
      name: "Analogous",
      css: "analogous-1",
    },
    { color: base, corrected: base, name: "Analogous" },
    {
      color: adjacent2,
      corrected: corrector(hex, 30),
      name: "Analogous",
      css: "analogous-2",
    },
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
    { color: base, corrected: base, name: "Tetradic", css: "Tetradic-1" },
    {
      color: tetrad1,
      corrected: corrector(hex, 90),
      name: "Tetradic",
      css: "Tetradic-2",
    },
    {
      color: tetrad2,
      corrected: corrector(hex, 90 * 2),
      name: "Tetradic",
      css: "Tetradic-3",
    },
    {
      color: tetrad3,
      corrected: corrector(hex, 90 * 3),
      name: "Tetradic",
      css: "Tetradic-4",
    },
  ]);
}

function createMonochromatic(hex) {
  const colors = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    color.hsl.s = 10;
    color.hsl.l = index * 10 + 8;
    colors.push({
      color: color,
      corrected: color,
      name: "Monochromatic",
      css: `mono-${index}`,
    });
  }

  return colorFactory(colors);
}

function createShades(hex) {
  const colors = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    color.hsl.l = index * 10 + 8;
    colors.push({
      color: color,
      corrected: color,
      name: "Shades",
      css: `shades-${index}`,
    });
  }

  return colorFactory(colors);
}

export {
  createComplement,
  createAdjacent,
  createTriad,
  createTetrad,
  createSplit,
  createMonochromatic,
  createShades,
};
