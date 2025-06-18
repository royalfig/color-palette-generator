import Color from 'colorjs.io'
import { ColorFormat, ColorSpace, PaletteKinds } from '../types'
import { generateAnalogous } from './analogous'
import { generateComplementary } from './complementary'
import { generateSplitComplementary } from './splitcomp'
import { generateTetradic } from './tetradic'
import { generateTintsAndShades } from './tints-and-shades'
import { generateTriadic } from './triadic'

export function createPalettes(
  color: string,
  palette: PaletteKinds,
  style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool',
  colorSpace: { space: ColorSpace; format: ColorFormat },
) {
  switch (palette) {
    case 'ana':
      return generateAnalogous(color, { style, colorSpace })
    case 'tri':
      return generateTriadic(color, { style, colorSpace })
    case 'tet':
      return generateTetradic(color, { style, colorSpace })
    case 'com':
      return generateComplementary(color, { style, colorSpace })
    case 'spl':
      return generateSplitComplementary(color, { style, colorSpace })
    case 'tas':
      return generateTintsAndShades(color, { style, colorSpace })
    default:
      throw new Error(`Invalid palette type: ${palette}`)
  }
}
