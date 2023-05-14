import Color from "colorjs.io";
import { toPrecision } from "./toPrecision";
import { adjustColor } from "./adjustColor";

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

export function colorFactory(colors, paletteInformation) {
  return colors.map((color, idx) => ({
    code: `${paletteInformation}-${idx + 1}`,
    hex: color.to("srgb").toString({ format: "hex" }),
    rgb: color.to("srgb").toString({ precision: 3 }),
    hsl: color.to("hsl").toString({ precision: 3 }),
    lch: color.to("oklch").toString({ precision: 3 }),
    point: color.hsl,
    contrast:
      color.contrast("black", "wcag21") > color.contrast("white", "wcag21")
        ? "#000"
        : "#fff",
    css: `${paletteInformation}`,
    cssRaw: `${toPrecision(color.to("hsl").h, 3)} ${toPrecision(
      color.to("hsl").s,
      3
    )}% ${toPrecision(color.to("hsl").l, 3)}%`,
  }));
}

export function corrector(color, adjustment) {
  const newColor = new Color(color);
  newColor.oklch.h += adjustment;
  return newColor;
}

function createColor(hex) {
  // TODO create base color
}

export function makeCinematic(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);
    adjusted.hsl.s *= 0.5;
    adjusted.hsl.l *= 1.5;
    return adjusted;
  });
}

export function makeLanguid(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    const adjusted = adjustColor(color, "h", valueToAdjust);
    return adjusted.mix("white", 0.5, {
      space: "oklch",
      outputSpace: "srgb",
    });
  });
}

export function makeKeel(colors) {
  return colors.map(({ color, valueToAdjust }) => {
    return corrector(color, valueToAdjust);
  });
}
