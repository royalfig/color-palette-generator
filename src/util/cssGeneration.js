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

// dark to bright for surface / dark to light for element
const darkStyles = `

--surface-1: #000;
--surface-2: var(--ton-og-10);
--surface-3: var(--ton-og-9);

--element-1: var(--ton-og-3);
--element-2: var(--ton-og-2);
--element-3: var(--ton-og-1);

--border-1: var(--ton-og-8);
--border-2: var(--ton-og-7);
--border-3: var(--ton-og-6);

`;

// dark to bright for surface / light to dark for element
const lightStyles = `

--surface-1: var(--ton-og-8);
--surface-2: var(--ton-og-9);
--surface-3: var(--ton-og-10);

--border-1: var(--ton-og-8);
--border-2: var(--ton-og-6);
--border-3: var(--ton-og-4);

--element-1: var(--ton-og-3);
--element-2: var(--ton-og-2);
--element-3: var(--ton-og-1);
`;

function cssWriter(args, isReversed) {
  return args
    .map(({ name, variations }) => {
      return variations
        .map((variation) => {
          if (isReversed) {
            variation.reverse();
          }
          return variation
            .map((color, idx) => {
              return `--${color.css}-${idx + 1}: ${color.hsl};
          --${color.css}-${idx + 1}-raw: ${color.cssRaw};
          --${color.css}-${idx + 1}-c: ${color.contrast};`;
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

  const css = cssWriter(
    [complement, analogous, tetrad, triad, tones, shades, split],
    false
  );

  const darkCss = cssWriter([tones, shades], true);

  const colorsId = document.querySelector("#colors");
  colorsId && colorsId.remove();
  const colors = document.createElement("style");
  colors.id = "colors";
  colors.textContent = `:root {--alpha: 1; --h: ${h}; --s: ${s}%; --l: ${l}%;${css}}`;
  document.head.append(colors);

  const lightId = document.querySelector("#light");
  lightId && lightId.remove();
  const light = document.createElement("style");
  light.id = "light";
  light.textContent = `:root[data-mode="light"] {${lightStyles}}`;
  document.head.append(light);

  const darkId = document.querySelector("#dark");
  darkId && darkId.remove();
  const dark = document.createElement("style");
  dark.id = "dark";
  dark.textContent = `:root[data-mode="dark"] {${darkStyles} ${darkCss}}`;
  document.head.append(dark);
}

export { generateCss, cssWriter };
