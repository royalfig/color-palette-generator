import Color from "colorjs.io";
import {
  colorFactory,
  adjustColor,
  makeCinematic,
  makeKeel,
  makeLanguid,
  makeSharkBite,
} from "./converters";

export function createAnalogous(hex) {
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

  const og = colorFactory([base, ana2, ana3], "ana-og");
  const ci = colorFactory([base, ci2, ci3], "ana-ci");
  const ke = colorFactory([base, ke2, ke3], "ana-ke");
  const la = colorFactory([la1, la2, la3], "ana-la");
  const sb = colorFactory([base, sb2, sb3], "ana-sb");

  const palette = {
    name: "analogous",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
