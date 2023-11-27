import { Schemes } from "../util/palettes"
export function useCurrentColor(palettes: Schemes) {
  return palettes.complementary.original[0].hex.string
}