import Color from "colorjs.io";
import {
  createAdjacent,
  createComplement,
  createMonochromatic,
  createTriad,
  createShades,
  createTetrad,
  createSplit,
} from "./converters";

function cssWriter(args) {
  return args
    .map(([palette, name]) => {
      return palette
        .map((color, idx) => {
          return `--${name}-${idx + 1}: ${color.hsl};
          --${name}-${idx + 1}-contrast: ${color.contrast};
          --${name}-${idx + 1}-corrected: ${color.corrected.hsl};
          --${name}-${idx + 1}-contrast-corrected: ${
            color.corrected.contrast
          };`;
        })
        .join("\n");
    })
    .join("\n");
}

function generateCss(hex) {
  const color = new Color(hex);
  const [h, s, l] = color.hsl;

  const complement = createComplement(color);
  const adjacent = createAdjacent(color);
  const tetrad = createTetrad(color);
  const triad = createTriad(color);
  const mono = createMonochromatic(color);
  const shades = createShades(color);
  const split = createSplit(color);

  const css = cssWriter([
    [complement, "complement"],
    [adjacent, "adjacent"],
    [triad, "triad"],
    [tetrad, "tetrad"],
    [mono, "mono"],
    [shades, "shades"],
    [split, "split"],
  ]);

  const styleTag = document.querySelector("#colors");
  styleTag && styleTag.remove();
  const style = document.createElement("style");
  style.id = "colors";
  style.textContent = `:root {--h: ${h}; --s: ${s}%; --l: ${l}%;` + css + "}";

  document.head.append(style);
}

export { generateCss, cssWriter };
