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

import { Rgb, Hsl, Lch, Oklch, Lab, Oklab, P3, Color } from 'culori'

function roundColor(color): Color {
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

export const colorParser = {
  hex: (color: Color | string) => formatHex(clampChroma(color)),
  rgb: (color: Color | string) => formatRgb(clampChroma(color)),
  rawRgb: (color: Color | string) => rgb(color),
  hsl: (color: Color | string) => formatHsl(clampChroma(color)),
  lch: (color: Color | string) => formatCss(roundColor<Lch>(lch(color))),
  oklch: (color: Color | string) => formatCss(roundColor(oklch(color))),
  lab: (color: Color | string) => formatCss(roundColor(lab(color))),
  oklab: (color: Color | string) => formatCss(roundColor(oklab(color))),
  p3: (color: Color | string) => formatCss(roundColor(p3(color))),
  inGamut: (color: Color | string) => displayable(color),
  contrast: (color: Color | string) => (wcagContrast(color, '#000') > wcagContrast(color, '#fff') ? '#000' : '#fff'),
  clamp: (color: Color | string) => clampRgb(color),
  formatCss: (color: Color | string) => formatCss(color),
  rawHsl: (color: Color | string) => roundColor(hsl(color)),
  chromaClamp: (color: Color | string) => clampChroma(color),
}
