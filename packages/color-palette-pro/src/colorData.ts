import Color from 'colorjs.io/types/src/color'
import { createScales } from './scales'

export function createColorData(baseColor: string | Color) {
  const scales = createScales(baseColor)
  return { scales }
}
