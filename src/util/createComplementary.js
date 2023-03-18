import Color from "colorjs.io";
import {
  colorFactory,
  adjustColor,
  makeCinematic,
  makeKeel,
  makeLanguid,
  makeSharkBite,
} from "./converters";

export function createComplement(hex) {
  const base = new Color(hex);
  const complement = adjustColor(hex, "h", 180);
  const value = [{ color: hex, valueToAdjust: 180 }];
  const [ci2] = makeCinematic(value);
  const [ke2] = makeKeel(value);
  const [la1, la2] = makeLanguid([{ color: hex, valueToAdjust: 0 }, ...value]);
  const [sb2] = makeSharkBite(value);

  const og = colorFactory([base, complement], "com-og");
  const ci = colorFactory([base, ci2], "com-ci");
  const ke = colorFactory([base, ke2], "com-ke");
  const la = colorFactory([la1, la2], "com-la");
  const sb = colorFactory([base, sb2], "com-sb");

  const palette = {
    name: "complementary",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
