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

import {  Lch, Oklch, Lab, Oklab, P3, Color } from 'culori'

type IndexableColor = Color & { [key: string]: any };

function roundColor<T extends IndexableColor | undefined >(color: T): T {
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
    return formatHex(clampRgb(color))
  } else {
    return formatHex(clampRgb(color))
  }
}

function clampChromaWrapper(color: string | Color) {
  if (typeof color === 'string') {
    const res = formatHex(clampChroma(color))
    return res
  } else {
    const res = formatHex(clampChroma(color))
    return res
  }
}

export const colorParser = {
  hex: (color: string | Color) => clampChromaWrapper(color),
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
