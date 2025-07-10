import Color from 'colorjs.io'
import { ColorFormat, ColorSpace, PaletteKinds } from '../types'
import { generateAnalogous } from './analogous'
import { generateComplementary } from './complementary'
import { generateSplitComplementary } from './splitcomp'
import { generateTetradic } from './tetradic'
import { generateTintsAndShades } from './tints-and-shades'
import { generateTriadic } from './triadic'
import { paletteModulator } from './modifiers'
import { BaseColorData } from './factory'

export function createPalettes(
  color: string,
  palette: PaletteKinds,
  style: 'square' | 'triangle' | 'circle' | 'diamond',
  colorSpace: { space: ColorSpace; format: ColorFormat },
  modulateValues = [0, 0, 0, 0],
) {
  let basePalette: BaseColorData[] = []
  console.log(palette)
  switch (palette) {
    case 'ana':
      basePalette = generateAnalogous(color, { style, colorSpace })
      break
    case 'tri':
      basePalette = generateTriadic(color, { style, colorSpace })
      break
    case 'tet':
      basePalette = generateTetradic(color, { style, colorSpace })
      break
    case 'com':
      basePalette = generateComplementary(color, { style, colorSpace })
      break
    case 'spl':
      basePalette = generateSplitComplementary(color, { style, colorSpace })
      break
    case 'tas':
      basePalette = generateTintsAndShades(color, { style, colorSpace })
      break
  }

  const modulatedPalette = paletteModulator(basePalette, modulateValues)
  console.log(modulatedPalette)
  return modulatedPalette
}
