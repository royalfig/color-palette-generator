import Color from 'colorjs.io'
import { PlainColorObject } from 'colorjs.io/types/src/color'
import { createColorObj } from './colorParse'

export function colorFactory(color: string | Color | PlainColorObject, paletteInformation: string, idx = 0) {
  return {
    code: `${paletteInformation}-${idx + 1}`,
    hex: createColorObj(color, 'hex', 3),
    rgb: createColorObj(color, 'srgb', 3),
    hsl: createColorObj(color, 'hsl', 3),
    lch: createColorObj(color, 'lch', 3),
    oklch: createColorObj(color, 'oklch', 3),
    lab: createColorObj(color, 'lab', 3),
    oklab: createColorObj(color, 'oklab', 3),
    p3: createColorObj(color, 'p3', 3),
  }
}

export type ColorFactory = ReturnType<typeof colorFactory>