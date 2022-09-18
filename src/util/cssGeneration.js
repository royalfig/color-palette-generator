import Color from "colorjs.io";

function generateCss(hex) {
  const color = new Color(hex);
  const [h, s, l] = color.hsl;

  document.documentElement.style = `--h: ${h}; --s: ${s}%; --l: ${l}%`;
}

export { generateCss };
