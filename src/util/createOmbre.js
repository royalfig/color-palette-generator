import Color from "colorjs.io";
import { colorFactory } from "./colorFactory";

import { adjustColor } from "../util";

export function createOmbre(hex) {
  const color = new Color(hex);
  const complement = adjustColor(color, "h", 180);

  const ogRange = color.steps(complement, {
    space: "srgb",
    outuptSpace: "srgb",
    steps: 10,
  });

  const cinematic = color.steps(complement, {
    space: "lab",
    outuptSpace: "srgb",
    steps: 10,
  });

  const keel = color.steps(complement, {
    space: "rec2020",
    outuptSpace: "srgb",
    steps: 10,
  });

  const languid = color.steps(complement, {
    space: "oklab",
    outuptSpace: "srgb",
    steps: 10,
  });

  const sharkbite = color.steps(complement, {
    space: "lch",
    outuptSpace: "srgb",
    steps: 10,
  });

  const og = colorFactory(ogRange, "omb-og");
  const ci = colorFactory(cinematic, "omb-ci");
  const ke = colorFactory(keel, "omb-ke");
  const la = colorFactory(languid, "omb-la");
  const sb = colorFactory(sharkbite, "omb-sb");

  const palette = {
    name: "ombre",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
