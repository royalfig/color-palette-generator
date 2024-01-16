import { PlainColorObject } from 'colorjs.io/types/src/color'
import { createColorObj } from './colorParse'
import Color from 'colorjs.io'

export function colorFactory(color: string | Color | PlainColorObject, paletteInformation: string, idx = 0) {
  return {
    code: `${paletteInformation}-${idx + 1}`,
    hex: createColorObj(color, 'hex', 5),
    rgb: createColorObj(color, 'srgb', 5),
    hsl: createColorObj(color, 'hsl', 5),
    lch: createColorObj(color, 'lch', 5),
    oklch: createColorObj(color, 'oklch', 5),
    lab: createColorObj(color, 'lab', 5),
    oklab: createColorObj(color, 'oklab', 5),
    p3: createColorObj(color, 'p3', 5),
  }
}

export type ColorFactory = ReturnType<typeof colorFactory>