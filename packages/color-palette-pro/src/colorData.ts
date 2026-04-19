import Color from 'colorjs.io/types/src/color'
import { createScales } from './scales'

export function createColorData(baseColor: string | Color) {
  const palettes = createPalettes(baseColor)
  const scales = createScales(baseColor)
  const ui = createUi(baseColor, palettes, scales)
}
