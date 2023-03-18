import Color from "colorjs.io";
import {
  colorFactory,
  adjustColor,
  makeCinematic,
  makeKeel,
  makeLanguid,
  makeSharkBite,
} from "./converters";

export function createTones(hex) {
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

    let mixed = color.mix("gray", 0.95, {
      space: "oklch",
      outputSpace: "srgb",
    });

    mixed.oklch.l = index * 10 + 8;

    tones.push(mixed);
  }

  const og = colorFactory(ogRange, "ton-og");
  const ci = colorFactory(tones, "ton-ci");
  const ke = colorFactory(tones, "ton-ke");
  const la = colorFactory(tones, "ton-la");
  const sb = colorFactory(tones, "ton-sb");

  const palette = {
    name: "tones",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
