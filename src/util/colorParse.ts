import {
  clampChroma,
  clampRgb,
  displayable,
  formatCss,
  formatHex,
  formatHsl,
  formatRgb,
  modeHsl,
  modeLab,
  modeLch,
  modeOklab,
  modeOklch,
  modeP3,
  modeRgb,
  useMode,
  wcagContrast,
} from 'culori/fn'

import{to as convert, contrastWCAG21, parse, ColorSpace, inGamut, sRGB, P3, HSL, LCH, serialize, OKLCH, OKLab, Lab, display} from "colorjs.io/fn"

ColorSpace.register(sRGB);
ColorSpace.register(P3);
ColorSpace.register(LCH);
ColorSpace.register(HSL);
ColorSpace.register(OKLCH);

const red = parse('lch(55.64 84.04 3.99)')
const redLch = display(convert(red, "lch"))



// import { Lch, Oklch, Lab, Oklab, P3 } from 'culori'

type IndexableColor = Color & { [key: string]: any }

function roundColor<T extends IndexableColor | undefined>(color: T): T {
  if (!color) throw new Error('Could not parse color')
  const objKeys = Object.keys(color)
  const roundedColor = objKeys.reduce((prev: any, acc: string) => {
    if (typeof color[acc] === 'number') {
      prev[acc] = Math.round(Number(color[acc]) * 100) / 100
    } else {
      prev[acc] = color[acc]
    }

    return prev
  }, {})

  return roundedColor
}
export const hsl = useMode(modeHsl)
const lab = useMode(modeLab)
export const lch = useMode(modeLch)
const oklab = useMode(modeOklab)
export const oklch = useMode(modeOklch)
const p3 = useMode(modeP3)
const rgb = useMode(modeRgb)

function clampRgbWrapper(color: string | Color) {
  if (typeof color === 'string') {
    if (!displayable(color)) {
      return clampRgb(color)
    } else {
      return color
    }
  } else {
    if (!displayable(color)) {
      return clampRgb(color)
    } else {
      return color
    }
  }
}

function clampChromaWrapper(color: string | Color) {
  if (typeof color === 'string') {
    if (!displayable(color)) {
      return clampChroma(color)
    } else {
      return color
    }
  } else {
    if (!displayable(color)) {
      return clampChroma(color)
    } else {
      return color
    }
  }
}

export function hex(color: string) {
  const parsed = parse(color);
  const convertedColor = convert(color, 'srgb');
    const isInGamut = inGamut(parsed, 'srgb');
    const str = serialize(convertedColor, { format: 'hex' })
    const css = str;
    const raw = parsed.coords
    const contrast = contrastWCAG21(parsed, '#fff') > contrastWCAG21(parsed, '#000') ? '#fff' : '#000'

  const convertedToHsl = convert(color, 'hsl', );
  const hslStr = serialize(convertedToHsl, { format: 'hsl', precision: 2 })
  const hslCss = display(hslStr, {space: 'hsl'}).toString()
  console.log(convertedToHsl, hslStr, hslCss)

  const parsedFromOk = parse('oklch(83.98% 0.3255 144)')
  const oconvertedColor = convert(parsedFromOk, 'srgb');
    const oisInGamut = inGamut(parsedFromOk, 'srgb');
    const ostr = serialize(parsedFromOk)
    const ocss = display(parsedFromOk);
console.log({contrast})

  return {
    string: str,
    css,
    isInGamut,
  }
}



export const colorParser = {
  hex: (color: string | Color) => formatHex(clampChromaWrapper(color)),
  rgb: (color: string | Color) => formatRgb(clampChromaWrapper(color)),
  rawRgb: (color: string | Color) => rgb(color),
  hsl: (color: string | Color) => formatHsl(clampChromaWrapper(color)),
  lch: (color: string | Color) => formatCss(roundColor<Lch | undefined>(lch(color))),
  oklch: (color: string | Color) => formatCss(roundColor<Oklch | undefined>(oklch(color))),
  lab: (color: string | Color) => formatCss(roundColor<Lab | undefined>(lab(color))),
  oklab: (color: string | Color) => formatCss(roundColor<Oklab | undefined>(oklab(color))),
  p3: (color: string | Color) => formatCss(roundColor<P3 | undefined>(p3(color))),
  inGamut: (color: string | Color) => displayable(color),
  contrast: (color: string | Color) => (wcagContrast(color, '#000') > wcagContrast(color, '#fff') ? '#000' : '#fff'),
  clamp: (color: string | Color) => clampRgbWrapper(color),
  formatCss: (color: string | Color) => formatCss(color),
  rawHsl: (color: string | Color) => roundColor(hsl(color)),
  chromaClamp: (color: string | Color) => clampChromaWrapper(color),
}
