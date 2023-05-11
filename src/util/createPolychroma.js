import Color from "colorjs.io";
import {
  colorFactory,
  adjustColor,
  makeCinematic,
  makeKeel,
  makeLanguid,
  makeSharkBite,
} from "./converters";

export function createPolychroma(hex) {
  const ogRange = [];

  for (let index = 0; index < 360; index += 36) {
    const color = new Color(hex);
    color.hsl.h += index;
    ogRange.push(color);
  }

  const keel = [];

  for (let index = 0; index < 360; index += 36) {
    const color = new Color(hex);

    color.lch.h += index;

    keel.push(color);
  }

  const cinematic = [];

  for (let index = 0; index < 360; index += 36) {
    const color = new Color(hex);

    color.oklch.h += index;

    cinematic.push(color);
  }

  const languid = [];

  for (let index = 0; index < 360; index += 36) {
    const color = new Color(hex);

    color.hsl.h += index;
    color.hsl.l *= 1.5;
    color.hsl.s *= 0.85;

    languid.push(color);
  }

  const sharkbite = [];

  for (let index = 0; index < 360; index += 36) {
    const color = new Color(hex);

    color.hsl.h += index;
    color.hsl.s = 100;

    sharkbite.push(color);
  }

  const og = colorFactory(ogRange, "ply-og");
  const ci = colorFactory(cinematic, "ply-ci");
  const ke = colorFactory(keel, "ply-ke");
  const la = colorFactory(languid, "ply-la");
  const sb = colorFactory(sharkbite, "ply-sb");

  const palette = {
    name: "polychroma",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
