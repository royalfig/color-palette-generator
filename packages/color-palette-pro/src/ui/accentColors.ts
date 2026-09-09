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
      // Slots 1 and 5 are BOTH the 180 complement, so the old 1/5 pick returned two colours on
      // one hue and secondary/tertiary collapsed. Take the complement and the light base instead,
      // which is the only pair in a two-hue scheme that differs in hue AND lightness.
      secondaryIndex = 1
      tertiaryIndex = 3
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
      // Tints & shades is a 12-step single-hue ramp: lightness is the only axis it has, so
      // adjacent steps (the old 5/6) were all but identical. Take widely separated steps.
      secondaryIndex = 3
      tertiaryIndex = 9
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
