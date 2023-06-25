import Color from "colorjs.io";
import { colorFactory } from "./colorFactory";
import { makeKeel } from "./makeKeel";
import { makeLanguid } from "./makeLanguid";
import { makeCinematic } from "./makeCinematic";
import { makeSharkBite } from "./makeSharkBite";
import { adjustColor } from "./adjustColor";

export function createTetradic(hex) {
  const base = new Color(hex);
  const tet2 = adjustColor(hex, "h", 90);
  const tet3 = adjustColor(hex, "h", 90 * 2);
  const tet4 = adjustColor(hex, "h", 90 * 3);

  const values = [
    { color: hex, valueToAdjust: 90 },
    { color: hex, valueToAdjust: 90 * 2 },
    { color: hex, valueToAdjust: 90 * 3 },
  ];

  const [ci2, ci3, ci4] = makeCinematic(values);
  const [ke2, ke3, ke4] = makeKeel(values);
  const [la1, la2, la3, la4] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    ...values,
  ]);
  const [sb2, sb3, sb4] = makeSharkBite(values);

  const og = colorFactory([base, tet2, tet3, tet4], "tet-og");
  const ci = colorFactory([base, ci2, ci3, ci4], "tet-ci");
  const ke = colorFactory([base, ke2, ke3, ke4], "tet-ke");
  const la = colorFactory([la1, la2, la3, la4], "tet-la");
  const sb = colorFactory([base, sb2, sb3, sb4], "tet-sb");

  const palette = {
    name: "tetradic",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
