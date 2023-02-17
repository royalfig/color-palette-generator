import Color from "colorjs.io";
import { hex3to6, getRandBetween, linearRGB, y, createSlug } from "./utils";

/*

{
  absolute: {
    base: {

    }
    variation1: {

    }
    variation2: {

    }
  }

  relative: {
    base: {

        }
        variation1: {

        }
        variation2: {
          
        }
      }
}


*/

function colorFactory(colors) {
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
      valForCss: `${Math.round(color.to("hsl").h)} ${Math.round(
        color.to("hsl").s
      )}% ${Math.round(color.to("hsl").l)}%`,
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
        valForCss: `${corrected.to("hsl").h} ${corrected.to("hsl").s}% ${
          corrected.to("hsl").l
        }%`,
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
      css: createSlug("Complementary"),
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
