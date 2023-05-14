import Color from "colorjs.io";
import {
  colorFactory,
  makeCinematic,
  makeKeel,
  makeLanguid,
} from "./converters";
import { makeSharkBite } from "./makeSharkBite";
import { adjustColor } from "./adjustColor";

export function createSplit(hex) {
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

  const og = colorFactory([base, spl1, spl2], "spl-og");
  const ci = colorFactory([base, ci1, ci2], "spl-ci");
  const ke = colorFactory([base, keel1, keel2], "spl-ke");
  const la = colorFactory([la1, la2, la3], "spl-la");
  const sb = colorFactory([base, sb1, sb2], "spl-sb");

  const palette = {
    name: "split complementary",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
