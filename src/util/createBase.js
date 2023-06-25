import { colorFactory } from "./colorFactory";
import Color from "colorjs.io";

export function createBase(color) {
  const base = new Color(color);
  return colorFactory([base], "base");
}
