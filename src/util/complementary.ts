import Color from 'colorjs.io'
import { colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'

export function getWarmCoolComplement(hue: number) {
  const adjustedHue = (hue + 180) % 360

  if (hue >= 0 && hue < 60) return (adjustedHue - 15 + 360) % 360 // Reds → deeper teals
  if (hue >= 60 && hue < 120) return (adjustedHue + 10) % 360 // Yellows → richer blues
  if (hue >= 240 && hue < 300) return (adjustedHue - 10 + 360) % 360 // Blues → warmer oranges

  return adjustedHue
}

function getVisuallyPleasingComplement(hue: number): number {
  // Adobe-inspired but refined for OKLCH
  if (hue >= 0 && hue < 45) {
    // Pure reds → Rich greens (120°-130°)
    return 120 + hue * 0.2 // Slight curve for variation
  }
  if (hue >= 45 && hue < 75) {
    // Red-oranges → Blue-greens (smoother transition)
    return 160 + (hue - 45) * 0.5
  }
  if (hue >= 225 && hue < 285) {
    // Blues → Warm yellows/oranges (Adobe's 50° target)
    return 45 + (hue - 225) * 0.1
  }
  if (hue >= 45 && hue < 105) {
    // Yellows → Rich purples (better than muddy browns)
    return 260 + (hue - 45) * 0.3
  }

  // Standard complement for other ranges
  return (hue + 180) % 360
}

function getAdaptiveComplement(baseColor: Color): number {
  const hue = baseColor.oklch.h
  let complement = getVisuallyPleasingComplement(hue)

  if (baseColor.oklch.c > 0.15) {
    complement = (complement + 10) % 360
  }

  if (baseColor.oklch.l > 0.85 || baseColor.oklch.l < 0.25) {
    const distance = Math.abs(complement - baseColor.oklch.h)
    complement = hue + distance * 0.8
  }

  return complement
}

/* oklch: {
  l: [0, 1],
  c: [0, 0.4],
  h: [0, 360],
},
*/

export function generateComplementary(
  baseColor: string,
  options: { chromaAdjust?: number; style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool' },
) {
  const { chromaAdjust = 0.9 } = options
  const format = detectFormat(baseColor)

  try {
    const baseColorObj = new Color(baseColor)
    const darkBase = baseColorObj.clone()
    const mutedBase = baseColorObj.clone()
    const mainComplement = baseColorObj.clone()
    const lightComplement = baseColorObj.clone()
    const mutedComplement = baseColorObj.clone()

    let complementHue: number

    switch (options.style) {
      case 'mathematical':
        complementHue = (mainComplement.oklch.h + 180) % 360
        break
      case 'optical':
        complementHue = getVisuallyPleasingComplement(mainComplement.oklch.h)
        break
      case 'adaptive':
        complementHue = getAdaptiveComplement(mainComplement)
        break
      case 'warm-cool':
        complementHue = getWarmCoolComplement(mainComplement.oklch.h)
        break
    }

    // Dark base
    const darkBaseValues = clampOKLCH(baseColorObj.oklch.l - 0.25, baseColorObj.oklch.c * 1.1, baseColorObj.oklch.h)
    darkBase.oklch.l = darkBaseValues.l
    darkBase.oklch.c = darkBaseValues.c
    darkBase.oklch.h = darkBaseValues.h

    // Muted base
    const mutedBaseValues = clampOKLCH(baseColorObj.oklch.l - 0.1, baseColorObj.oklch.c * 0.6, baseColorObj.oklch.h)
    mutedBase.oklch.l = mutedBaseValues.l
    mutedBase.oklch.c = mutedBaseValues.c
    mutedBase.oklch.h = mutedBaseValues.h

    // Main complement (bright)
    const mainCompValues = clampOKLCH(
      baseColorObj.oklch.l + 0.1,
      baseColorObj.oklch.c * chromaAdjust * 1.1,
      complementHue,
    )
    mainComplement.oklch.l = mainCompValues.l
    mainComplement.oklch.c = mainCompValues.c
    mainComplement.oklch.h = mainCompValues.h

    // Light complement (medium)
    const lightCompValues = clampOKLCH(baseColorObj.oklch.l, baseColorObj.oklch.c * 0.8, complementHue)
    lightComplement.oklch.l = lightCompValues.l
    lightComplement.oklch.c = lightCompValues.c
    lightComplement.oklch.h = lightCompValues.h

    // Muted complement
    const mutedCompValues = clampOKLCH(baseColorObj.oklch.l - 0.15, baseColorObj.oklch.c * 0.4, complementHue)
    mutedComplement.oklch.l = mutedCompValues.l
    mutedComplement.oklch.c = mutedCompValues.c
    mutedComplement.oklch.h = mutedCompValues.h

    return [
      colorFactory(baseColor, 'complementary', 0, format),
      colorFactory(mainComplement, 'complementary', 1, format),
      colorFactory(darkBase, 'complementary', 2, format),
      colorFactory(mutedBase, 'complementary', 3, format),
      colorFactory(lightComplement, 'complementary', 4, format),
      colorFactory(mutedComplement, 'complementary', 5, format),
    ]
  } catch (e) {
    throw new Error(`Failed to generate complementary colors for ${baseColor}: ${e}`)
  }
}
