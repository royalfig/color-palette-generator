import Color from "colorjs.io";
import {
  createComplement,
  createAnalogous,
  createTriad,
  createTetradic,
  createSplit,
  createTones,
  createTintsAndShades,
} from "./converters";

function cssWriter(args, isReversed) {
  return args
    .map(({ name, variations }) => {
      return variations
        .map((variation) => {
          variation =
            isReversed && (name === "tones" || name === "tints and shades")
              ? [...variation].reverse()
              : variation;

          return variation
            .map((color) => {
              return `--${color.code}: ${color.hsl};
          --${color.code}-raw: ${color.cssRaw};
          --${color.code}-c: ${color.contrast};`;
            })
            .join("\n");
        })
        .join("\n");
    })
    .join("\n");
}

function generateCss(hex) {
  const color = new Color(hex);
  const [h, s, l] = color.hsl;

  const complement = createComplement(color);
  const analogous = createAnalogous(color);
  const tetrad = createTetradic(color);
  const triad = createTriad(color);
  const tones = createTones(color);
  const shades = createTintsAndShades(color);
  const split = createSplit(color);

  const css = cssWriter([
    complement,
    analogous,
    tetrad,
    triad,
    tones,
    shades,
    split,
  ]);

  const darkCss = cssWriter(
    [complement, analogous, tetrad, triad, tones, shades, split],
    true
  );

  const styleTag = document.querySelector("#colors");
  styleTag && styleTag.remove();
  const style = document.createElement("style");
  style.id = "colors";
  style.textContent = `:root[data-mode="light"] {--alpha: 1; --h: ${h}; --s: ${s}%; --l: ${l}%;${css}}
  :root[data-mode="dark"] {--alpha: 1; --h: ${h}; --s: ${s}%; --l: ${l}%;${darkCss}}`;

  document.head.append(style);
}

export { generateCss, cssWriter };
