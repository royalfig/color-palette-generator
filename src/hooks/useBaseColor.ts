import { ColorFactory } from "../util/factory"
import { Schemes } from "../util/palettes"
export function useBaseColor(palettes: Schemes): ColorFactory {
  return palettes.complementary.original[0] 
}