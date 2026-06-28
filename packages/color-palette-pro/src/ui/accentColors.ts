import Color from 'colorjs.io'
import { BaseColorData } from '../factory'
import { PaletteKinds } from '../types/types'

/**
 * Selects secondary and tertiary colors from the palette.
 */
export function selectAccentColors(
  paletteType: PaletteKinds,
  palette: BaseColorData[],
): { secondary: Color; tertiary: Color } {
  const safeGetColor = (index: number): Color => {
    if (!palette[index]?.color) {
      throw Error("Can't get accent color")
    }
    return palette[index].color.clone()
  }

  let secondaryIndex: number
  let tertiaryIndex: number

  switch (paletteType) {
    case 'com':
      secondaryIndex = 1
      tertiaryIndex = 5
      break
    case 'spl':
      secondaryIndex = 2
      tertiaryIndex = 4
      break
    case 'tri':
      secondaryIndex = 3
      tertiaryIndex = 4
      break
    case 'tet':
      secondaryIndex = 2
      tertiaryIndex = 4
      break
    case 'ana':
      secondaryIndex = 1
      tertiaryIndex = 5
      break
    case 'tas':
      secondaryIndex = 5
      tertiaryIndex = 6
      break
    default:
      secondaryIndex = 1
      tertiaryIndex = 4
  }

  return {
    secondary: safeGetColor(secondaryIndex),
    tertiary: safeGetColor(tertiaryIndex),
  }
}
