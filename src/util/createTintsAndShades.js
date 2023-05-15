import Color from "colorjs.io";
import { colorFactory } from "./converters";
import { makeKeel } from "./makeKeel";
import { makeLanguid } from "./makeLanguid";
import { makeCinematic } from "./makeCinematic";
import { makeSharkBite } from "./makeSharkBite";
import { adjustColor } from "./adjustColor";

export function createTintsAndShades(hex) {
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
        space: "oklch",
        outputSpace: "srgb",
      });
      keRange.push(shade);
    }

    if (index > 4) {
      // 5, 6, 7, 8, 9
      let tint = color.mix("white", index / 10, {
        space: "oklch",
        outputSpace: "srgb",
      });
      keRange.push(tint);
    }
  }

  const ciHi = new Color(hex).mix("white", 0.5, {
    space: "oklch",
    outputSpace: "srgb",
  });
  const ciLo = new Color(hex).mix("black", 0.5, {
    space: "oklch",
    outputSpace: "srgb",
  });

  const ciRange = ciLo.steps(ciHi, {
    space: "oklch",
    outputSpace: "srgb",
    steps: 10,
  });

  const t = ciLo.range(ciHi, { space: "oklch" });

  const og = colorFactory(ogRange, "tas-og");
  const ci = colorFactory(ciRange, "tas-ci");
  const ke = colorFactory(keRange, "tas-ke");
  const la = colorFactory(keRange, "tas-la");
  const sb = colorFactory(keRange, "tas-sb");

  const palette = {
    name: "tints and shades",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
