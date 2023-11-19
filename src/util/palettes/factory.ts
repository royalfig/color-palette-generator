import { colorParser } from '../../lib/colorParse'
import { Color } from 'culori'

export function colorFactory(color: string | Color, paletteInformation: string, idx = 0) {
  const hsl = colorParser.rawHsl(color)
  if (!hsl) throw new Error('Could not parse color')
  const { h, s, l } = hsl

  return {
    code: `${paletteInformation}-${idx + 1}`,
    hex: colorParser.hex(color),
    rgb: colorParser.rgb(color),
    hsl: colorParser.hsl(color),
    lch: colorParser.lch(color),
    oklch: colorParser.oklch(color),
    lab: colorParser.oklab(color),
    oklab: colorParser.oklab(color),
    p3: colorParser.p3(color),
    inGamut: colorParser.inGamut(color),
    point: [h, s * 100],
    //   contrast: colorParser.contrast(color),
    css: `${paletteInformation}`,
    cssRaw: [h, s * 100 + '%', l * 100 + '%'].join(' '),
  }
}
