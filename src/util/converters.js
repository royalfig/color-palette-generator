import Color from "colorjs.io";
import { hex3to6, getRandBetween, linearRGB, y, createSlug } from "./utils";
import { toPrecision } from "./toPrecision";
import { mix } from "colorjs.io/fn";

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

function colorFactory2(colors, paletteInformation) {
  return colors.map((color, idx) => ({
    code: `${paletteInformation}-${idx + 1}`,
    hex: color.toString({ format: "hex" }),
    rgb: color.to("srgb").toString({ precision: 3 }),
    hsl: color.to("hsl").toString({ precision: 3 }),
    lch: color.to("lch").toString({ precision: 3 }),
    point: color.hsl,
    contrast:
      color.contrast("black", "wcag21") > color.contrast("white", "wcag21")
        ? "#000"
        : "#fff",
    css: `${paletteInformation}-${idx + 1}`,
    cssRaw: `${toPrecision(color.to("hsl").h, 3)} ${toPrecision(
      color.to("hsl").s,
      3
    )}% ${toPrecision(color.to("hsl").l, 3)}%`,
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
  return colors.map(({ color, valueToAdjust }) => {
    return corrector(color, valueToAdjust);
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
  const value = [{ color: hex, valueToAdjust: 180 }];
  const [ci2] = makeCinematic(value);
  const [ke2] = makeKeel(value);
  const [la1, la2] = makeLanguid([{ color: hex, valueToAdjust: 0 }, ...value]);
  const [sb2] = makeSharkBite(value);

  const og = colorFactory2([base, complement], "com-og");
  const ci = colorFactory2([base, ci2], "com-ci");
  const ke = colorFactory2([base, ke2], "com-ke");
  const la = colorFactory2([la1, la2], "com-la");
  const sb = colorFactory2([base, sb2], "com-sb");

  const palette = {
    name: "complementary",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}

function createSplit(hex) {
  const base = new Color(hex);
  const spl1 = adjustColor(hex, "h", 150);
  const spl2 = adjustColor(hex, "h", 210);

  const values = [
    { color: hex, valueToAdjust: 150 },
    { color: hex, valueToAdjust: 210 },
  ];

  const [keel1, keel2] = makeKeel(values);

  const [ci1, ci2] = makeCinematic(values);

  const [la1, la2, la3] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    ...values,
  ]);

  const [sb1, sb2] = makeSharkBite([
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

  return palette;
}

function createTriad(hex) {
  const tri1 = new Color(hex);
  const tri2 = adjustColor(hex, "h", 120);
  const tri3 = adjustColor(hex, "h", 240);

  const values = [
    { color: hex, valueToAdjust: 120 },
    { color: hex, valueToAdjust: 240 },
  ];

  const [ci2, ci3] = makeCinematic(values);
  const [ke2, ke3] = makeKeel(values);
  const [la1, la2, la3] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    ...values,
  ]);
  const [sb2, sb3] = makeSharkBite(values);

  const og = colorFactory2([tri1, tri2, tri3], "tri-og");
  const ci = colorFactory2([tri1, ci2, ci3], "tri-ci");
  const ke = colorFactory2([tri1, ke2, ke3], "tri-ke");
  const la = colorFactory2([la1, la2, la3], "tri-la");
  const sb = colorFactory2([tri1, sb2, sb3], "tri-sb");

  const palette = {
    name: "triadic",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}

function createAnalogous(hex) {
  const base = new Color(hex);
  const ana2 = adjustColor(hex, "h", 30, "minus");
  const ana3 = adjustColor(hex, "h", 30);

  const values = [
    { color: hex, valueToAdjust: -30 },
    { color: hex, valueToAdjust: 30 },
  ];

  const [ci2, ci3] = makeCinematic(values);
  const [ke2, ke3] = makeKeel(values);
  const [la1, la2, la3] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    ...values,
  ]);
  const [sb2, sb3] = makeSharkBite(values);

  const og = colorFactory2([base, ana2, ana3], "ana-og");
  const ci = colorFactory2([base, ci2, ci3], "ana-ci");
  const ke = colorFactory2([base, ke2, ke3], "ana-ke");
  const la = colorFactory2([la1, la2, la3], "ana-la");
  const sb = colorFactory2([base, sb2, sb3], "ana-sb");

  const palette = {
    name: "analogous",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}

function createTetradic(hex) {
  const base = new Color(hex);
  const tet2 = adjustColor(hex, "h", 90);
  const tet3 = adjustColor(hex, "h", 90 * 2);
  const tet4 = adjustColor(hex, "h", 90 * 3);

  const values = [
    { color: hex, valueToAdjust: 90 },
    { color: hex, valueToAdjust: 90 * 2 },
    { color: hex, valueToAdjust: 90 * 3 },
  ];

  const [ci2, ci3, ci4] = makeCinematic(values);
  const [ke2, ke3, ke4] = makeKeel(values);
  const [la1, la2, la3, la4] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    ...values,
  ]);
  const [sb2, sb3, sb4] = makeSharkBite(values);

  const og = colorFactory2([base, tet2, tet3, tet4], "tet-og");
  const ci = colorFactory2([base, ci2, ci3, ci4], "tet-ci");
  const ke = colorFactory2([base, ke2, ke3, ke4], "tet-ke");
  const la = colorFactory2([la1, la2, la3, la4], "tet-la");
  const sb = colorFactory2([base, sb2, sb3, sb4], "tet-sb");

  const palette = {
    name: "tetradic",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}

function createTones(hex) {
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

  const ogRange = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    color.hsl.s = 10;
    color.hsl.l = index * 10 + 8;
    ogRange.push(color);
  }

  const tones = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);

    let mixed = color.mix("gray", 0.9, {
      space: "lch",
      outputSpace: "srgb",
    });

    mixed.lch.l = index * 10 + 8;

    tones.push(mixed);
  }

  const og = colorFactory2(ogRange, "ton-og");
  const ci = colorFactory2(tones, "ton-ci");
  const ke = colorFactory2(tones, "ton-ke");
  const la = colorFactory2(tones, "ton-la");
  const sb = colorFactory2(tones, "ton-sb");

  const palette = {
    name: "tones",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}

function createTintsAndShades(hex) {
  const ogRange = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    color.hsl.l = index * 10 + 8;
    ogRange.push(color);
  }

  const keRange = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);

    if (index < 5) {
      // 0, 1, 2, 3, 4
      let shade = color.mix("black", (10 - index) / 10, {
        space: "lch",
        outputSpace: "srgb",
      });
      keRange.push(shade);
    }

    if (index > 4) {
      // 5, 6, 7, 8, 9
      let tint = color.mix("white", index / 10, {
        space: "lch",
        outputSpace: "srgb",
      });
      keRange.push(tint);
    }
  }

  const ciHi = new Color(hex).mix("white", 0.5, {
    space: "lch",
    outputSpace: "srgb",
  });
  const ciLo = new Color(hex).mix("black", 0.5, {
    space: "lch",
    outputSpace: "srgb",
  });

  const ciRange = ciLo.steps(ciHi, {
    space: "lch",
    outputSpace: "srgb",
    steps: 10,
  });

  const t = ciLo.range(ciHi, { space: "lch" });

  console.log(t(0.5));

  const og = colorFactory2(ogRange, "tas-og");
  const ci = colorFactory2(ciRange, "tas-ci");
  const ke = colorFactory2(keRange, "tas-ke");
  const la = colorFactory2(keRange, "tas-la");
  const sb = colorFactory2(keRange, "tas-sb");

  const palette = {
    name: "tints and shades",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}

// Todo createPolychroma, createBands
// polychroma -> lisa frank -> steps of 36deg
// Bands -> expanded analogous -> steps of 10
// Ombre --> comp -< range

export {
  createComplement,
  createAnalogous,
  createTriad,
  createTetradic,
  createSplit,
  createTones,
  createTintsAndShades,
};
