import Color from "colorjs.io";
import { colorFactory } from "./colorFactory";

export function createTones(hex) {
  const ogRange = [];

  for (let index = 0; index < 10; index++) {
    const color = new Color(hex);
    color.hsl.s = 10;
    color.hsl.l = index * 10 + 8;
    ogRange.push(color);
  }

  const darkest = new Color(hex);
  darkest.lch.l = 1;
  darkest.lch.c = 0.2;

  const dark = new Color(hex);
  dark.lch.l = 20;
  dark.lch.c = 0.2;

  const light = new Color(hex);
  light.lch.l = 88;
  light.lch.c = 0.2;
  const lightest = new Color(hex);
  lightest.lch.l = 99;
  lightest.lch.c = 0.2;

  const darkScale = darkest.steps(dark, {
    space: "lch",
    outputSpace: "srgb",
    steps: 5,
  });

  const lightScale = light.steps(lightest, {
    space: "lch",
    outputSpace: "srgb",
    steps: 5,
  });

  const keel = [...darkScale, ...lightScale];

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
