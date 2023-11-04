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

function roundColor(color) {
  const roundedColor = Object.keys(color).reduce((acc, key) => {
    if (typeof color[key] === 'number') {
      acc[key] = Math.round(color[key] * 100) / 100
    } else {
      acc[key] = color[key]
    }

    return acc
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
  hex: color => formatHex(clampChroma(color)),
  rgb: color => formatRgb(clampChroma(color)),
  rawRgb: color => rgb(color),
  hsl: color => formatHsl(clampChroma(color)),
  lch: color => formatCss(roundColor(lch(color))),
  oklch: color => formatCss(roundColor(oklch(color))),
  lab: color => formatCss(roundColor(lab(color))),
  oklab: color => formatCss(roundColor(oklab(color))),
  p3: color => formatCss(roundColor(p3(color))),
  inGamut: color => displayable(color),
  contrast: color => (wcagContrast(color, '#000') > wcagContrast(color, '#fff') ? '#000' : '#fff'),
  clamp: color => clampRgb(color),
  formatCss: color => formatCss(color),
  rawHsl: color => roundColor(hsl(color)),
  chromaClamp: color => clampChroma(color),
}
