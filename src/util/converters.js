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

function colorFactory2(colors, paletteInformation) {
  return colors.map((color, idx) => ({
    code: `${paletteInformation}-${idx + 1}`,
    hex: color.toString({ format: "hex" }),
    rgb: color.to("srgb").toString({ precision: 3 }),
    hsl: color.to("hsl").toString({ precision: 3 }),
    lch: color.to("lch").toString({ precision: 3 }),
    contrast:
      color.contrast("black", "wcag21") > color.contrast("white", "wcag21")
        ? "#000"
        : "#fff",
    css: paletteInformation,
    cssRaw: `${toPrecision(color.to("hsl").h, 3)} ${toPrecision(
      color.to("hsl").s,
      3
    )} ${toPrecision(color.to("hsl").l, 3)}`,
  }));
}

function corrector(color, adjustment) {
  const newColor = new Color(color);
  newColor.lch.h += adjustment;
  return newColor;
}

function createColor(hex) {
  // TODO create base color
}

function adjustColor(hex, valueToAdjust, adjustment, operator) {
  const color = new Color(hex);
  console.log(color.hsl[valueToAdjust]);
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

function makeCinematic(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);
    adjusted.hsl.s *= 0.5;
    adjusted.hsl.l *= 1.5;
    return adjusted;
  });
}

function makeLanguid(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);

    return adjusted.mix("white", 0.5, {
      space: "lch",
      outputSpace: "srgb",
    });
  });
}

function makeKeel(colors) {
  return colors.map(({ color, adjustment }) => {
    return corrector(color, adjustment);
  });
}

function makeSharkBite(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);

    adjusted.hsl.s *= 0.7;
    adjusted.hsl.l *= 0.3;

    return adjusted;
  });
}

function createComplement(hex) {
  const base = new Color(hex);
  const complement = adjustColor(hex, "h", 180);

  const [cinematic] = makeCinematic([{ color: hex, valueToAdjust: 180 }]);

  const [keel] = makeKeel([{ color: hex, adjustment: 180 }]);

  const [laBase, laComp] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    { color: hex, valueToAdjust: 180 },
  ]);

  const [sbComp] = makeSharkBite([{ color: hex, valueToAdjust: 180 }]);

  const og = colorFactory2([base, complement], "com-og");
  const ci = colorFactory2([base, cinematic], "com-ci");
  const ke = colorFactory2([base, keel], "com-ke");
  const la = colorFactory2([laBase, laComp], "com-la");
  const sb = colorFactory2([base, sbComp], "com-sb");

  const palette = {
    name: "complementary",
    variations: [og, ci, ke, la, sb],
  };

  console.log(palette);

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
  const spl1 = adjustColor(hex, "h", 150);
  const spl2 = adjustColor(hex, "h", 210);

  const [keel1, keel2] = makeKeel([
    { color: hex, adjustment: 150 },
    { color: hex, adjustment: 210 },
  ]);

  const [ci1, ci2] = makeCinematic([
    { color: hex, valueToAdjust: 150 },
    { color: hex, valueToAdjust: 210 },
  ]);

  const [la1, la2, la3] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    { color: hex, valueToAdjust: 150 },
    { color: hex, valueToAdjust: 210 },
  ]);

  const [sb1, sb2] = makeLanguid([
    { color: hex, valueToAdjust: 150 },
    { color: hex, valueToAdjust: 210 },
  ]);

  const og = colorFactory2([base, spl1, spl2], "spl-og");
  const ci = colorFactory2([base, ci1, ci2], "spl-ci");
  const ke = colorFactory2([base, keel1, keel2], "spl-ke");
  const la = colorFactory2([la1, la2, la3], "spl-la");
  const sb = colorFactory2([base, sb1, sb2], "spl-sb");

  const palette = {
    name: "split complementary",
    variations: [og, ci, ke, la, sb],
  };
  console.log(palette);
  return colorFactory([
    {
      color: spl1,
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
      color: spl2,
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
