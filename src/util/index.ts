import Color from 'colorjs.io'
import { PaletteKinds } from '../types'
import { generateAnalogous } from './analogous'
import { generateComplementary } from './complementary'
import { generateSplitComplementary } from './splitcomp'
import { generateTetradic } from './tetradic'
import { generateTintsAndShades } from './tints-and-shades'
import { generateTones } from './tones'
import { generateTriadic } from './triadic'

export function createPalettes(
  color: string,
  palette: PaletteKinds,
  style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool',
) {
  switch (palette) {
    case 'ana':
      return generateAnalogous(color, { style })
    case 'tri':
      return generateTriadic(color, { style })
    case 'tet':
      return generateTetradic(color, { style })
    case 'com':
      return generateComplementary(color, { style })
    case 'spl':
      return generateSplitComplementary(color, { style })
    case 'tas':
      return generateTintsAndShades(color, { style })
    case 'ton':
      return generateTones(color, { style })
  }
}
