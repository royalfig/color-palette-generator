import { ColorFactory } from '../util/factory'
import { Schemes } from '../util/palettes'
export function useBaseColor(palettes: Schemes): ColorFactory {
  return palettes.comp.original[0]
}
