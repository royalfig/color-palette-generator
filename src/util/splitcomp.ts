import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { getWarmCoolComplement } from './complementary'

function getMathematicalSplitComplementary(hue: number): number[] {
  // Pure mathematical - complement ±30°
  const complement = (hue + 180) % 360
  return [hue, (complement - 30 + 360) % 360, (complement + 30) % 360]
}

function getWarmCoolSplitComplementary(hue: number): number[] {
  // Use warm-cool complement as base, then split
  const complement = getWarmCoolComplement(hue)
  return [hue, (complement - 25 + 360) % 360, (complement + 35) % 360]
}

function getVisuallyPleasingSplitComplementary(hue: number): number[] {
  // Adobe-style with optimized splits
  if (hue >= 0 && hue < 60) {
    // Red-based: split around green area
    return [hue, (hue + 130) % 360, (hue + 150) % 360]
  }
  if (hue >= 60 && hue < 120) {
    // Yellow-based: split around purple/blue
    return [hue, (hue + 160) % 360, (hue + 200) % 360]
  }
  if (hue >= 240 && hue < 300) {
    // Blue-based: split around orange/yellow
    return [hue, (hue + 140) % 360, (hue + 160) % 360]
  }

  // Default: standard ±30° split
  const complement = (hue + 180) % 360
  return [hue, (complement - 30 + 360) % 360, (complement + 30) % 360]
}

function getAdaptiveSplitComplementary(baseColor: Color): number[] {
  const oklch = baseColor.to('oklch')
  const hue = oklch.h

  // Start with visually pleasing as base
  let complements = getVisuallyPleasingSplitComplementary(hue)

  // Adapt based on color properties
  if (oklch.c > 0.25) {
    // High saturation: widen the split for more drama
    const baseComp = (hue + 180) % 360
    complements = [hue, (baseComp - 35 + 360) % 360, (baseComp + 35) % 360]
  }

  if (oklch.l > 0.85 || oklch.l < 0.25) {
    // Extreme lightness: narrow the split for harmony
    const baseComp = (hue + 180) % 360
    complements = [hue, (baseComp - 20 + 360) % 360, (baseComp + 20) % 360]
  }

  return complements
}

function generateGrayscaleSplitComplementary(
  baseColor: Color,
  format: 'hex' | 'rgb' | 'hsl' | 'oklch' | 'oklab' | 'lch' | 'lab' | 'p3' | undefined,
): string[] {
  // For grays, create 6 lightness variations
  const variations = [
    0, // Original
    0.2, // Lighter (like first complement)
    -0.15, // Darker (like second complement)
    0.35, // Much lighter (variant of first)
    -0.25, // Much darker (variant of second)
    0.1, // Slight variation of base
  ]

  return variations.map((lightAdj, index) => {
    if (index === 0) {
      return colorFactory(baseColor, 'split-complementary', index, format).string
    }

    const gray = baseColor.clone()
    const values = clampOKLCH(baseColor.oklch.l + lightAdj, 0, 0)
    gray.oklch.l = values.l

    return colorFactory(gray, 'split-complementary', index, format).string
  })
}

export function generateSplitComplementary(
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
      return generateGrayscaleSplitComplementary(baseColorObj, format)
    }

    let splitHues: number[]

    switch (style) {
      case 'mathematical':
        splitHues = getMathematicalSplitComplementary(baseColorObj.oklch.h)
        break
      case 'optical':
        splitHues = getVisuallyPleasingSplitComplementary(baseColorObj.oklch.h)
        break
      case 'adaptive':
        splitHues = getAdaptiveSplitComplementary(baseColorObj)
        break
      case 'warm-cool':
        splitHues = getWarmCoolSplitComplementary(baseColorObj.oklch.h)
        break
    }

    const colors: BaseColorData[] = []

    // Create 6 colors from 3 split complementary hues
    splitHues.forEach((hue, splitIndex) => {
      if (splitIndex === 0) {
        // Base color + darker variant
        colors.push(colorFactory(baseColor, 'split-complementary', 0, format))

        const darkBaseValues = clampOKLCH(baseColorObj.oklch.l - 0.2, baseColorObj.oklch.c * 1.1, hue)
        const darkBase = baseColorObj.clone()
        darkBase.oklch.l = darkBaseValues.l
        darkBase.oklch.c = darkBaseValues.c
        darkBase.oklch.h = darkBaseValues.h
        colors.push(colorFactory(darkBase, 'split-complementary', 1, format))
      } else {
        // Split complement colors + their variants
        const pureValues = clampOKLCH(
          baseColorObj.oklch.l + (splitIndex === 1 ? 0.1 : -0.05),
          baseColorObj.oklch.c * 0.9,
          hue,
        )
        const pureColor = baseColorObj.clone()
        pureColor.oklch.l = pureValues.l
        pureColor.oklch.c = pureValues.c
        pureColor.oklch.h = pureValues.h

        const mutedValues = clampOKLCH(
          baseColorObj.oklch.l + (splitIndex === 1 ? -0.1 : 0.15),
          baseColorObj.oklch.c * 0.7,
          hue,
        )
        const mutedColor = baseColorObj.clone()
        mutedColor.oklch.l = mutedValues.l
        mutedColor.oklch.c = mutedValues.c
        mutedColor.oklch.h = mutedValues.h

        if (splitIndex === 1) {
          colors.push(colorFactory(pureColor, 'split-complementary', 2, format))
          colors.push(colorFactory(mutedColor, 'split-complementary', 3, format))
        } else {
          colors.push(colorFactory(pureColor, 'split-complementary', 4, format))
          colors.push(colorFactory(mutedColor, 'split-complementary', 5, format))
        }
      }
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate split-complementary colors for ${baseColor}: ${e}`)
  }
}
