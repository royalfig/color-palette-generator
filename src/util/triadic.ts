import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { detectFormat, clampOKLCH } from './utils'

function getMathematicalTriadic(hue: number): number[] {
  // Pure mathematical - rigid 30° steps
  return [hue, (hue + 120) % 360, (hue + 240) % 360]
}

function getVisuallyPleasingTriadic(hue: number): number[] {
  if (hue >= 0 && hue < 60) {
    return [hue, (hue + 125) % 360, (hue + 235) % 360]
  }
  if (hue >= 240 && hue < 300) {
    return [hue, (hue + 115) % 360, (hue + 245) % 360]
  }
  return [hue, (hue + 120) % 360, (hue + 240) % 360]
}

function getWarmCoolTriadic(hue: number): number[] {
  // Adjust spacing for more pleasing relationships
  const adjustments = {
    second: hue >= 180 ? 125 : 115, // Slightly varied spacing
    third: hue >= 180 ? 235 : 245,
  }

  return [hue, (hue + adjustments.second) % 360, (hue + adjustments.third) % 360]
}

function getAdaptiveTriadic(baseColor: Color): number[] {
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  let spacing1 = 120
  let spacing2 = 240

  // Adapt based on color properties
  if (oklch.c > 0.25) {
    // High saturation colors can handle more dramatic spacing
    spacing1 = 125
    spacing2 = 235
  }

  if (oklch.l > 0.8) {
    // Very light colors need closer harmony
    spacing1 = 115
    spacing2 = 245
  }

  // Avoid problematic triadic combinations
  if (hue >= 30 && hue < 90) {
    // Yellow-orange range - tighten spacing
    spacing1 = 110
    spacing2 = 250
  }

  return [hue, (hue + spacing1) % 360, (hue + spacing2) % 360]
}

function generateGrayscaleTriadic(
  baseColor: Color,
  format: 'hex' | 'rgb' | 'hsl' | 'oklch' | 'oklab' | 'lch' | 'lab' | 'p3' | undefined,
): BaseColorData[] {
  // For grays, create 6 lightness variations
  const variations = [
    0, // Original
    -0.15, // Darker
    0.1, // Lighter
    -0.25, // Much darker
    0.2, // Much lighter
    -0.35, // Very dark
  ]

  return variations.map((lightAdj, index) => {
    if (index === 0) {
      return colorFactory(baseColor, 'triadic', index, format)
    }

    const gray = baseColor.clone()
    const values = clampOKLCH(baseColor.oklch.l + lightAdj, 0, 0)
    gray.oklch.l = values.l

    return colorFactory(gray, 'triadic', index, format)
  })
}

export function generateTriadic(
  baseColor: string,
  options: {
    style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'
  },
) {
  const { style } = options
  const format = detectFormat(baseColor)

  try {
    const baseColorObj = new Color(baseColor)

    // Handle achromatic colors
    if (isNaN(baseColorObj.oklch.h) || baseColorObj.oklch.c < 0.01) {
      return generateGrayscaleTriadic(baseColorObj, format)
    }

    let triadicHues: number[]

    switch (style) {
      case 'mathematical':
        triadicHues = getMathematicalTriadic(baseColorObj.oklch.h)
        break
      case 'optical':
        triadicHues = getVisuallyPleasingTriadic(baseColorObj.oklch.h)
        break
      case 'adaptive':
        triadicHues = getAdaptiveTriadic(baseColorObj)
        break
      case 'warm-cool':
        triadicHues = getWarmCoolTriadic(baseColorObj.oklch.h)
        break
    }

    const colors: BaseColorData[] = []

    // For each of the 3 triadic hues, create 2 variations
    triadicHues.forEach((hue, triadIndex) => {
      if (triadIndex === 0) {
        // Base color family: original + darker variant
        colors.push(colorFactory(baseColor, 'triadic', 0, format))

        const darkBaseValues = clampOKLCH(baseColorObj.oklch.l - 0.2, baseColorObj.oklch.c * 1.1, hue)
        const darkBase = baseColorObj.clone()
        darkBase.oklch.l = darkBaseValues.l
        darkBase.oklch.c = darkBaseValues.c
        darkBase.oklch.h = darkBaseValues.h
        colors.push(colorFactory(darkBase, 'triadic', 1, format))
      } else {
        // Other triadic families: pure + muted variant
        const pureValues = clampOKLCH(baseColorObj.oklch.l, baseColorObj.oklch.c * 0.95, hue)
        const pureColor = baseColorObj.clone()
        pureColor.oklch.l = pureValues.l
        pureColor.oklch.c = pureValues.c
        pureColor.oklch.h = pureValues.h
        colors.push(colorFactory(pureColor, 'triadic', triadIndex * 2, format))

        const mutedValues = clampOKLCH(
          baseColorObj.oklch.l + (triadIndex === 1 ? 0.1 : -0.1),
          baseColorObj.oklch.c * 0.7,
          hue,
        )
        const mutedColor = baseColorObj.clone()
        mutedColor.oklch.l = mutedValues.l
        mutedColor.oklch.c = mutedValues.c
        mutedColor.oklch.h = mutedValues.h
        colors.push(colorFactory(mutedColor, 'triadic', triadIndex * 2 + 1, format))
      }
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate triadic colors for ${baseColor}: ${e}`)
  }
}
