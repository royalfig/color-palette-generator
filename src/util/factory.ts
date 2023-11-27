import { PlainColorObject } from 'colorjs.io/types/src/color'
import { createColorObj } from './colorParse'
import Color from 'colorjs.io'

export function colorFactory(color: string | Color | PlainColorObject, paletteInformation: string, idx = 0) {
  return {
    code: `${paletteInformation}-${idx + 1}`,
    hex: createColorObj(color, 'hex'),
    rgb: createColorObj(color, 'srgb'),
    hsl: createColorObj(color, 'hsl'),
    lch: createColorObj(color, 'lch'),
    oklch: createColorObj(color, 'oklch'),
    lab: createColorObj(color, 'lab'),
    oklab: createColorObj(color, 'oklab'),
    p3: createColorObj(color, 'p3'),
  }
}

export type ColorFactory = ReturnType<typeof colorFactory>