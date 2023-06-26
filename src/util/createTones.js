import Color from "colorjs.io";
import { colorFactory } from "./colorFactory";
import { makeKeel } from "./makeKeel";
import { makeLanguid } from "./makeLanguid";
import { makeCinematic } from "./makeCinematic";
import { makeSharkBite } from "./makeSharkBite";
import { adjustColor } from "./adjustColor";

export function createTones(hex) {
  const ogRange = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    color.hsl.s = 10;
    color.hsl.l = index * 10 + 8;
    ogRange.push(color);
  }

  const start = new Color(hex);
  start.hsl.l = 0;
  start.mix("gray", 0.5);

  const end = new Color(hex);
  end.hsl.l = 100;
  start.mix("gray", 0.5);

  const keel = start.steps(end, {
    space: "lch",
    outputSpace: "srgb",
    steps: 10,
  });

  console.log({ keel });

  const cinematic = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);

    color.oklch.l = (index + 1) / 10;

    let mixed = color.mix("gray", 0.25, {
      space: "oklch",
      outputSpace: "srgb",
    });

    cinematic.push(mixed);
  }

  const languid = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);

    color.oklch.l = (index + 1) / 9;

    let mixed = color.mix("gray", 0.15, {
      space: "oklch",
      outputSpace: "srgb",
    });

    languid.push(mixed);
  }

  const shark = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);

    color.oklch.l = (index + 1) / 10;
    color.oklch.c = 0.4;

    let mixed = color.mix("gray", 0.25, {
      space: "oklab",
      outputSpace: "srgb",
    });

    shark.push(mixed);
  }

  const og = colorFactory(ogRange, "ton-og");
  const ci = colorFactory(cinematic, "ton-ci");
  const ke = colorFactory(keel, "ton-ke");
  const la = colorFactory(languid, "ton-la");
  const sb = colorFactory(keel, "ton-sb");

  const palette = {
    name: "tones",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
