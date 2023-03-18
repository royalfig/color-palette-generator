import Color from "colorjs.io";
import {
  colorFactory,
  adjustColor,
  makeCinematic,
  makeKeel,
  makeLanguid,
  makeSharkBite,
} from "./converters";

export function createTriad(hex) {
  const tri1 = new Color(hex);
  const tri2 = adjustColor(hex, "h", 120);
  const tri3 = adjustColor(hex, "h", 240);

  const values = [
    { color: hex, valueToAdjust: 120 },
    { color: hex, valueToAdjust: 240 },
  ];

  const [ci2, ci3] = makeCinematic(values);
  const [ke2, ke3] = makeKeel(values);
  const [la1, la2, la3] = makeLanguid([
    { color: hex, valueToAdjust: 0 },
    ...values,
  ]);
  const [sb2, sb3] = makeSharkBite(values);

  const og = colorFactory([tri1, tri2, tri3], "tri-og");
  const ci = colorFactory([tri1, ci2, ci3], "tri-ci");
  const ke = colorFactory([tri1, ke2, ke3], "tri-ke");
  const la = colorFactory([la1, la2, la3], "tri-la");
  const sb = colorFactory([tri1, sb2, sb3], "tri-sb");

  const palette = {
    name: "triadic",
    variations: [og, ci, ke, la, sb],
  };

  return palette;
}
