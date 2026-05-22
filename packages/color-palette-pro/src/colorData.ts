import Color from 'colorjs.io'
import { createScales } from './scales'

export function createColorData(baseColor: string | Color) {
  const scales = createScales(baseColor)
  return { scales }
}
