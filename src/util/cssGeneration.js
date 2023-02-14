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

function cssWriter(args, isReversed) {
  return args
    .map(([palette, name]) => {
      palette =
        isReversed && (name === "mono" || name === "shades")
          ? [...palette].reverse()
          : palette;

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
    [mono, "mono"],
    [shades, "shades"],
    [complement, "complement"],
    [adjacent, "adjacent"],
    [triad, "triad"],
    [tetrad, "tetrad"],
    [split, "split"],
  ]);

  const darkCss = cssWriter(
    [
      [mono, "mono"],
      [shades, "shades"],
      [complement, "complement"],
      [split, "split"],
      [adjacent, "adjacent"],
      [triad, "triad"],
      [tetrad, "tetrad"],
    ],
    true
  );

  const styleTag = document.querySelector("#colors");
  styleTag && styleTag.remove();
  const style = document.createElement("style");
  style.id = "colors";
  style.textContent = `:root[data-mode="light"] {--h: ${h}; --s: ${s}%; --l: ${l}%;${css}}
  :root[data-mode="dark"] {--h: ${h}; --s: ${s}%; --l: ${l}%;${darkCss}}`;

  document.head.append(style);
}

export { generateCss, cssWriter };
