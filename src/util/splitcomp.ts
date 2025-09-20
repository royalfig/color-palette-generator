import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { getWarmCoolComplement } from './complementary'
import { ColorFormat, ColorSpace } from '../types'
import { applyEnhancementsToSplitComplementary, avoidMuddyZones, polishPalette } from './enhancer'

function getMathematicalSplitComplementary(hue: number): number[] {
  // Pure mathematical - complement ±30°
  const complement = (hue + 180) % 360
  return [hue, (complement - 30 + 360) % 360, (complement + 30) % 360]
}

function getOpticalSplitComplementary(baseColor: Color): number[] {
  // Perceptual Harmony: Based on how our visual system processes split complements
  const hue = baseColor.oklch.h

  // Human vision processes split complements differently based on hue region
  if (hue >= 0 && hue < 45) {
    // Pure reds: split around the blue-green region for maximum visual impact
    // Avoid yellows (muddy) and go for rich teals/cyans
    return [hue, (hue + 155) % 360, (hue + 185) % 360] // Teal to cyan split
  }

  if (hue >= 45 && hue < 90) {
    // Orange-reds: split in the blue region with asymmetric spacing
    // Natural opponent process creates uneven split
    return [hue, (hue + 165) % 360, (hue + 205) % 360] // Blue-cyan to blue-purple
  }

  if (hue >= 90 && hue < 135) {
    // Yellow-greens: split in purple-magenta region
    // Avoid browns, go for rich purples
    return [hue, (hue + 170) % 360, (hue + 210) % 360] // Purple to magenta split
  }

  if (hue >= 135 && hue < 180) {
    // Greens: split in red-magenta region following natural opponent process
    return [hue, (hue + 160) % 360, (hue + 200) % 360] // Red to magenta split
  }

  if (hue >= 180 && hue < 225) {
    // Cyans: split in warm red-orange region
    return [hue, (hue + 150) % 360, (hue + 190) % 360] // Orange to red split
  }

  if (hue >= 225 && hue < 270) {
    // Blues: split in orange-yellow region with natural spacing
    return [hue, (hue + 145) % 360, (hue + 175) % 360] // Orange to yellow split
  }

  if (hue >= 270 && hue < 315) {
    // Blue-purples: split in yellow-green region
    return [hue, (hue + 135) % 360, (hue + 165) % 360] // Yellow to green split
  }

  // Magentas: split in green region
  return [hue, (hue + 125) % 360, (hue + 155) % 360] // Green split
}

function getAdaptiveSplitComplementary(baseColor: Color): number[] {
  // Emotional Resonance: Creates split complements that tell emotional stories
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine emotional profile and create meaningful splits
  if (hue >= 345 || hue < 30) {
    // Passionate reds → Calming and refreshing split (water themes)
    return [
      hue,
      (hue + 165) % 360, // Cool teal (calming water)
      (hue + 195) % 360, // Deep cyan (refreshing depth)
    ]
  }

  if (hue >= 30 && hue < 90) {
    // Energetic oranges/yellows → Mysterious and dreamy split
    const intensity = chroma * lightness
    return [
      hue,
      (hue + 160 + intensity * 15) % 360, // Deeper blues for more intense oranges
      (hue + 200 + intensity * 10) % 360, // Dream purples
    ]
  }

  if (hue >= 90 && hue < 150) {
    // Natural greens → Passionate and creative split (fire themes)
    return [
      hue,
      (hue + 170) % 360, // Passionate magenta
      (hue + 210) % 360, // Creative red-purple
    ]
  }

  if (hue >= 150 && hue < 210) {
    // Tranquil blues → Warm and energetic split (hearth themes)
    return [
      hue,
      (hue + 155) % 360, // Warm orange (hearth fire)
      (hue + 185) % 360, // Golden yellow (warm light)
    ]
  }

  if (hue >= 210 && hue < 270) {
    // Mysterious blues → Natural and energetic split
    return [
      hue,
      (hue + 145) % 360, // Natural orange
      (hue + 175) % 360, // Energetic yellow
    ]
  }

  // Creative purples → Natural and tranquil split (earth and sky)
  return [
    hue,
    (hue + 135) % 360, // Earth yellow-green
    (hue + 165) % 360, // Sky blue-green
  ]
}

function getLuminositySplitComplementary(baseColor: Color): number[] {
  // Luminosity Dance: Based on how light creates natural split complement relationships
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine lighting scenario and create realistic split complements

  if (lightness > 0.8 && chroma < 0.3) {
    // Bright daylight scenario: creates gentle split shadows
    return [
      hue,
      (hue + 170) % 360, // Cool shadow
      (hue + 190) % 360, // Deeper cool shadow
    ]
  }

  if (hue >= 30 && hue < 90 && lightness > 0.6) {
    // Golden hour scenario: warm light creates cool split shadows
    const shadowShift = 160 // Base shadow angle
    return [
      hue,
      (hue + shadowShift) % 360, // Primary cool shadow
      (hue + shadowShift + 30) % 360, // Secondary cool shadow
    ]
  }

  if (hue >= 180 && hue < 240 && lightness < 0.5) {
    // Cool/moonlight scenario: creates warm split complements
    return [
      hue,
      (hue + 140) % 360, // Warm candlelight
      (hue + 170) % 360, // Warm firelight
    ]
  }

  if (chroma > 0.8 && lightness < 0.4) {
    // Dramatic lighting scenario: creates strong temperature splits
    const isWarm = hue < 180
    if (isWarm) {
      // Warm dramatic light creates wide cool split
      return [
        hue,
        (hue + 150) % 360, // Cool dramatic complement
        (hue + 210) % 360, // Deep cool complement
      ]
    } else {
      // Cool dramatic light creates wide warm split
      return [
        hue,
        (hue + 150) % 360, // Warm dramatic complement
        (hue + 210) % 360, // Deep warm complement
      ]
    }
  }

  if (hue >= 270 && hue < 330) {
    // Artificial/magical light: creates impossible but beautiful splits
    return [
      hue,
      (hue + 120) % 360, // Complementary artificial color 1
      (hue + 160) % 360, // Complementary artificial color 2
    ]
  }

  // Natural balanced light: creates gentle, realistic splits
  const lightInfluence = lightness * 15 - 7.5 // -7.5 to +7.5 degree shift
  return [hue, (hue + 165 + lightInfluence) % 360, (hue + 195 - lightInfluence) % 360]
}

export function generateSplitComplementary(
  baseColor: string,
  options: {
    style: 'square' | 'triangle' | 'circle' | 'diamond'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { style } = options
  const format = options.colorSpace.format
  const enhanced = options.style === 'square' ? false : true

  try {
    const baseColorObj = new Color(baseColor)

    let splitHues: number[]

    switch (style) {
      case 'square':
        splitHues = getMathematicalSplitComplementary(baseColorObj.oklch.h)
        break
      case 'triangle':
        splitHues = getOpticalSplitComplementary(baseColorObj)
        break
      case 'circle':
        splitHues = getAdaptiveSplitComplementary(baseColorObj)
        break
      case 'diamond':
        splitHues = getLuminositySplitComplementary(baseColorObj)
        break
    }

    // Get base color properties for adaptive lightness
    const baseLightness = baseColorObj.oklch.l
    const baseChroma = baseColorObj.oklch.c

    // Create adaptive lightness adjustments based on input color
    function getAdaptiveLightnessAdjustments() {
      // Ensure palette spans a good lightness range (0.15 to 0.9)
      const targetRange = { min: 0.15, max: 0.9 }

      let baseVariations, complementVariations

      if (baseLightness < 0.3) {
        // Dark base: create lighter complement variants
        baseVariations = {
          dark: { l: Math.max(-0.1, targetRange.min - baseLightness), c: 1.0 },
        }
        complementVariations = {
          first: { pure: { l: 0.3, c: 0.9 }, muted: { l: 0.15, c: 0.7 } },
          second: { pure: { l: 0.2, c: 0.9 }, muted: { l: 0.4, c: 0.6 } },
        }
      } else if (baseLightness > 0.7) {
        // Light base: create darker complement variants
        baseVariations = {
          dark: { l: Math.max(-0.4, targetRange.min - baseLightness), c: 1.1 },
        }
        complementVariations = {
          first: { pure: { l: -0.2, c: 0.9 }, muted: { l: -0.35, c: 0.7 } },
          second: { pure: { l: -0.3, c: 0.9 }, muted: { l: -0.15, c: 0.7 } },
        }
      } else {
        // Mid-range base: create balanced distribution
        baseVariations = {
          dark: { l: -0.2, c: 1.1 },
        }
        complementVariations = {
          first: { pure: { l: 0.15, c: 0.9 }, muted: { l: -0.15, c: 0.7 } },
          second: { pure: { l: -0.1, c: 0.9 }, muted: { l: 0.2, c: 0.7 } },
        }
      }

      return { baseVariations, complementVariations }
    }

    let { baseVariations, complementVariations } = getAdaptiveLightnessAdjustments()

    if (style === 'triangle') {
      // Perceptual harmony: adjust based on base lightness while maintaining natural feel
      const lightnessModifier = baseLightness < 0.4 ? 0.1 : baseLightness > 0.6 ? -0.1 : 0

      baseVariations = {
        dark: { l: Math.max(-0.18 + lightnessModifier, -0.3), c: 0.95 },
      }
      complementVariations = {
        first: {
          pure: { l: 0.08 - lightnessModifier, c: 0.85 },
          muted: { l: -0.08 - lightnessModifier, c: 0.65 },
        },
        second: {
          pure: { l: -0.02 - lightnessModifier, c: 0.88 },
          muted: { l: 0.12 - lightnessModifier, c: 0.68 },
        },
      }
    } else if (style === 'circle') {
      // Emotional resonance: varies by emotional type
      const hue = baseColorObj.oklch.h
      // Emotional resonance: varies by emotional type, adapted for base lightness
      const lightnessAdaptation = baseLightness < 0.4 ? 0.15 : baseLightness > 0.6 ? -0.15 : 0

      if (hue >= 345 || hue < 30) {
        // passionate - adapt intensity based on base lightness
        baseVariations = {
          dark: { l: Math.max(-0.2 + lightnessAdaptation, -0.35), c: 1.2 },
        }
        complementVariations = {
          first: {
            pure: { l: 0.15 - lightnessAdaptation, c: 0.8 },
            muted: { l: -0.05 - lightnessAdaptation, c: 0.6 },
          },
          second: {
            pure: { l: 0.1 - lightnessAdaptation, c: 0.85 },
            muted: { l: 0.2 - lightnessAdaptation, c: 0.65 },
          },
        }
      } else if (hue >= 150 && hue < 210) {
        // tranquil - maintain gentleness while ensuring range
        baseVariations = {
          dark: { l: Math.max(-0.15 + lightnessAdaptation, -0.25), c: 0.9 },
        }
        complementVariations = {
          first: {
            pure: { l: 0.12 - lightnessAdaptation, c: 0.95 },
            muted: { l: -0.08 - lightnessAdaptation, c: 0.75 },
          },
          second: {
            pure: { l: 0.08 - lightnessAdaptation, c: 0.9 },
            muted: { l: 0.18 - lightnessAdaptation, c: 0.7 },
          },
        }
      }
    } else if (style === 'diamond') {
      // Luminosity dance: based on lighting scenario
      const lightness = baseColorObj.oklch.l
      const chroma = baseColorObj.oklch.c

      if (lightness > 0.8 && chroma < 0.3) {
        // daylight - strong contrast but prevent over-darkening
        baseVariations = {
          dark: { l: Math.max(-0.25, 0.15 - lightness), c: 1.0 },
        }
        complementVariations = {
          first: {
            pure: { l: -0.05, c: 0.8 },
            muted: { l: -0.2, c: 0.5 },
          },
          second: {
            pure: { l: -0.08, c: 0.75 },
            muted: { l: 0.05, c: 0.55 },
          },
        }
      } else if (chroma > 0.8 && lightness < 0.4) {
        // dramatic - enhance contrast while ensuring visibility
        baseVariations = {
          dark: { l: Math.max(-0.2, 0.15 - lightness), c: 1.3 },
        }
        complementVariations = {
          first: {
            pure: { l: 0.25, c: 1.1 },
            muted: { l: 0.1, c: 0.8 },
          },
          second: {
            pure: { l: 0.35, c: 1.0 },
            muted: { l: 0.15, c: 0.75 },
          },
        }
      }
    }

    const initialColors: Color[] = []

    splitHues.forEach((hue, splitIndex) => {
      if (splitIndex === 0) {
        // Base color + darker variant
        initialColors.push(new Color(baseColor)) // Preserve base

        const darkBaseValues = clampOKLCH(
          baseColorObj.oklch.l + baseVariations.dark.l,
          baseColorObj.oklch.c * baseVariations.dark.c,
          hue,
        )
        const darkBase = baseColorObj.clone()
        darkBase.oklch.l = darkBaseValues.l
        darkBase.oklch.c = darkBaseValues.c
        darkBase.oklch.h = darkBaseValues.h
        initialColors.push(darkBase)
      } else {
        // Split complement colors + their variants
        const isFirstSplit = splitIndex === 1
        const variations = isFirstSplit ? complementVariations.first : complementVariations.second

        // Apply muddy zone avoidance if enhanced mode
        let finalHue = hue
        if (enhanced) {
          const cleaned = avoidMuddyZones(
            hue,
            baseColorObj.oklch.l + variations.pure.l,
            baseColorObj.oklch.c * variations.pure.c,
          )
          finalHue = cleaned.h
        }

        const pureValues = clampOKLCH(
          baseColorObj.oklch.l + variations.pure.l,
          baseColorObj.oklch.c * variations.pure.c,
          finalHue,
        )
        const pureColor = baseColorObj.clone()
        pureColor.oklch.l = pureValues.l
        pureColor.oklch.c = pureValues.c
        pureColor.oklch.h = pureValues.h

        const mutedValues = clampOKLCH(
          baseColorObj.oklch.l + variations.muted.l,
          baseColorObj.oklch.c * variations.muted.c,
          finalHue,
        )
        const mutedColor = baseColorObj.clone()
        mutedColor.oklch.l = mutedValues.l
        mutedColor.oklch.c = mutedValues.c
        mutedColor.oklch.h = mutedValues.h

        initialColors.push(pureColor, mutedColor)
      }
    })

    const finalColors = enhanced
      ? polishPalette(applyEnhancementsToSplitComplementary(initialColors, style, 0), 0) // Base is at index 0
      : initialColors

    // Convert to your color factory format
    const colors: BaseColorData[] = []

    finalColors.forEach((color, index) => {
      if (index === 0) {
        colors.push(colorFactory(baseColor, 'split-complementary', index, format, true))
      } else {
        colors.push(colorFactory(color, 'split-complementary', index, format))
      }
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate split-complementary colors for ${baseColor}: ${e}`)
  }
}
