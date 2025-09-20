import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { detectFormat, clampOKLCH } from './utils'
import { ColorFormat, ColorSpace } from '../types'
import { avoidMuddyZones, polishPalette, applyEnhancementsToTriadic } from './enhancer'

function getMathematicalTriadic(hue: number): number[] {
  // Pure mathematical - rigid 120° steps
  return [hue, (hue + 120) % 360, (hue + 240) % 360]
}

function getOpticalTriadic(baseColor: Color): number[] {
  // Perceptual Harmony: Based on how human vision processes triadic relationships
  const hue = baseColor.oklch.h

  // Human vision processes triadic relationships differently based on hue regions
  if (hue >= 0 && hue < 60) {
    // Red-orange base: create rich, vibrant triad avoiding muddy zones
    return [
      hue, // Base red-orange
      (hue + 125) % 360, // Rich green (avoid muddy yellow-green)
      (hue + 235) % 360, // Deep blue-purple
    ]
  }

  if (hue >= 60 && hue < 120) {
    // Yellow-orange base: wider spacing to avoid brown/olive zones
    return [
      hue, // Base yellow-orange
      (hue + 135) % 360, // Blue-green (skip muddy zone)
      (hue + 225) % 360, // Red-purple
    ]
  }

  if (hue >= 120 && hue < 180) {
    // Green base: natural triadic relationships
    return [
      hue, // Base green
      (hue + 115) % 360, // Red-orange
      (hue + 245) % 360, // Blue-purple
    ]
  }

  if (hue >= 180 && hue < 240) {
    // Cyan-blue base: vibrant, clear triad
    return [
      hue, // Base cyan-blue
      (hue + 120) % 360, // Red (perfect complement relationship)
      (hue + 240) % 360, // Yellow-green
    ]
  }

  if (hue >= 240 && hue < 300) {
    // Blue-purple base: sophisticated triad
    return [
      hue, // Base blue-purple
      (hue + 115) % 360, // Yellow-orange
      (hue + 245) % 360, // Green
    ]
  }

  // Purple-magenta base: creative, energetic triad
  return [
    hue, // Base purple-magenta
    (hue + 125) % 360, // Yellow
    (hue + 235) % 360, // Cyan-green
  ]
}

function getAdaptiveTriadic(baseColor: Color): number[] {
  // Emotional Resonance: Creates triads that tell complete emotional stories
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine emotional profile and create three-part narrative
  if (hue >= 345 || hue < 30) {
    // Passionate reds → Fire, earth, and sky elements
    return [
      hue, // Fire (passionate base)
      (hue + 130) % 360, // Earth (grounding green)
      (hue + 230) % 360, // Sky (cooling blue)
    ]
  }

  if (hue >= 30 && hue < 90) {
    // Energetic oranges/yellows → Sun, sea, and night
    const intensity = chroma * lightness
    return [
      hue, // Sun energy
      (hue + 120 + intensity * 15) % 360, // Sea depth (varies with intensity)
      (hue + 240 - intensity * 10) % 360, // Night mystery
    ]
  }

  if (hue >= 90 && hue < 150) {
    // Natural greens → Forest, sunset, and ocean
    return [
      hue, // Forest (natural base)
      (hue + 125) % 360, // Sunset (warm complement)
      (hue + 235) % 360, // Ocean (cool complement)
    ]
  }

  if (hue >= 150 && hue < 210) {
    // Tranquil blues → Water, fire, and earth
    return [
      hue, // Water (tranquil base)
      (hue + 115) % 360, // Fire (energizing contrast)
      (hue + 245) % 360, // Earth (grounding warmth)
    ]
  }

  if (hue >= 210 && hue < 270) {
    // Mysterious blues → Night, dawn, and forest
    return [
      hue, // Night mystery
      (hue + 130) % 360, // Dawn awakening
      (hue + 230) % 360, // Forest depth
    ]
  }

  // Creative purples → Magic, nature, and energy
  return [
    hue, // Magic (creative base)
    (hue + 120) % 360, // Nature (grounding reality)
    (hue + 240) % 360, // Energy (dynamic force)
  ]
}

function getWarmCoolTriadic(baseColor: Color): number[] {
  // Luminosity Dance: Based on how three light sources create balanced illumination
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine lighting scenario and create three-point illumination

  if (lightness > 0.8 && chroma < 0.3) {
    // Bright daylight scenario: three balanced natural light sources
    return [
      hue, // Primary daylight
      (hue + 125) % 360, // Reflected light (slightly shifted)
      (hue + 235) % 360, // Shadow light (cooler)
    ]
  }

  if (hue >= 30 && hue < 90 && lightness > 0.6) {
    // Golden hour scenario: warm key with cool fills
    return [
      hue, // Golden key light
      (hue + 110) % 360, // Cool fill light
      (hue + 250) % 360, // Deep shadow/ambient
    ]
  }

  if (hue >= 180 && hue < 240 && lightness < 0.5) {
    // Cool/moonlight scenario: cool primary with warm accents
    return [
      hue, // Cool moonlight
      (hue + 130) % 360, // Warm firelight
      (hue + 230) % 360, // Warm candlelight
    ]
  }

  if (chroma > 0.8 && lightness < 0.4) {
    // Dramatic three-point lighting: strong contrast triangle
    const isWarm = hue < 180
    if (isWarm) {
      return [
        hue, // Warm dramatic key
        (hue + 115) % 360, // Cool dramatic fill
        (hue + 245) % 360, // Cool dramatic back
      ]
    } else {
      return [
        hue, // Cool dramatic key
        (hue + 125) % 360, // Warm dramatic fill
        (hue + 235) % 360, // Warm dramatic back
      ]
    }
  }

  if (hue >= 270 && hue < 330) {
    // Artificial/stage lighting: three colored spots
    return [
      hue, // Primary colored light
      (hue + 135) % 360, // Secondary colored light
      (hue + 225) % 360, // Tertiary colored light
    ]
  }

  // Natural three-point setup: balanced, realistic
  const lightInfluence = (lightness - 0.5) * 15 // -7.5 to +7.5 shift
  return [
    hue, // Key light
    (hue + 120 + lightInfluence) % 360, // Fill light
    (hue + 240 - lightInfluence) % 360, // Back light
  ]
}

export function generateTriadic(
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

    let triadicHues: number[]

    switch (style) {
      case 'square':
        triadicHues = getMathematicalTriadic(baseColorObj.oklch.h)
        break
      case 'triangle':
        triadicHues = getOpticalTriadic(baseColorObj)
        break
      case 'circle':
        triadicHues = getAdaptiveTriadic(baseColorObj)
        break
      case 'diamond':
        triadicHues = getWarmCoolTriadic(baseColorObj)
        break
    }

    // Get base color properties for adaptive lightness
    const baseLightness = baseColorObj.oklch.l
    const baseChroma = baseColorObj.oklch.c

    // Create adaptive lightness adjustments based on input color
    function getAdaptiveLightnessAdjustments() {
      // Ensure palette spans a good lightness range (0.15 to 0.9)
      const targetRange = { min: 0.15, max: 0.9 }

      let baseVariations, triadVariations

      if (baseLightness < 0.3) {
        // Dark base: create lighter triad variants
        baseVariations = {
          dark: { l: Math.max(-0.1, targetRange.min - baseLightness), c: 1.0 },
        }
        triadVariations = {
          first: { pure: { l: 0.2, c: 0.95 }, muted: { l: 0.35, c: 0.7 } },
          second: { pure: { l: 0.15, c: 0.95 }, muted: { l: 0.3, c: 0.7 } },
        }
      } else if (baseLightness > 0.7) {
        // Light base: create darker triad variants
        baseVariations = {
          dark: { l: Math.max(-0.4, targetRange.min - baseLightness), c: 1.1 },
        }
        triadVariations = {
          first: { pure: { l: -0.2, c: 0.95 }, muted: { l: -0.35, c: 0.7 } },
          second: { pure: { l: -0.25, c: 0.95 }, muted: { l: -0.15, c: 0.7 } },
        }
      } else {
        // Mid-range base: create balanced distribution
        baseVariations = {
          dark: { l: -0.2, c: 1.1 },
        }
        triadVariations = {
          first: { pure: { l: 0.1, c: 0.95 }, muted: { l: 0.2, c: 0.7 } },
          second: { pure: { l: -0.1, c: 0.95 }, muted: { l: -0.2, c: 0.7 } },
        }
      }

      return { baseVariations, triadVariations }
    }

    let { baseVariations, triadVariations } = getAdaptiveLightnessAdjustments()

    if (style === 'triangle') {
      // Perceptual harmony: adjust based on base lightness
      const lightnessModifier = baseLightness < 0.4 ? 0.1 : baseLightness > 0.6 ? -0.1 : 0

      baseVariations = {
        dark: { l: Math.max(-0.18 + lightnessModifier, -0.3), c: 1.0 },
      }
      triadVariations = {
        first: {
          pure: { l: 0.05 - lightnessModifier, c: 0.9 },
          muted: { l: 0.12 - lightnessModifier, c: 0.65 },
        },
        second: {
          pure: { l: -0.02 - lightnessModifier, c: 0.92 },
          muted: { l: -0.08 - lightnessModifier, c: 0.68 },
        },
      }
    } else if (style === 'circle') {
      // Emotional resonance: varies by emotional type
      const hue = baseColorObj.oklch.h
      // Emotional resonance: adapt for base lightness
      const lightnessAdaptation = baseLightness < 0.4 ? 0.15 : baseLightness > 0.6 ? -0.15 : 0

      if (hue >= 345 || hue < 30) {
        // passionate - ensure visibility
        baseVariations = {
          dark: { l: Math.max(-0.25 + lightnessAdaptation, -0.35), c: 1.2 },
        }
        triadVariations = {
          first: {
            pure: { l: 0.08 - lightnessAdaptation, c: 0.85 },
            muted: { l: 0.15 - lightnessAdaptation, c: 0.6 },
          },
          second: {
            pure: { l: 0.05 - lightnessAdaptation, c: 0.9 },
            muted: { l: -0.05 - lightnessAdaptation, c: 0.65 },
          },
        }
      } else if (hue >= 150 && hue < 210) {
        // tranquil - maintain balance
        baseVariations = {
          dark: { l: Math.max(-0.15 + lightnessAdaptation, -0.25), c: 0.9 },
        }
        triadVariations = {
          first: {
            pure: { l: 0.1 - lightnessAdaptation, c: 0.9 },
            muted: { l: 0.18 - lightnessAdaptation, c: 0.7 },
          },
          second: {
            pure: { l: 0.05 - lightnessAdaptation, c: 0.85 },
            muted: { l: -0.08 - lightnessAdaptation, c: 0.6 },
          },
        }
      }
    } else if (style === 'diamond') {
      // Luminosity dance: based on lighting scenario
      const lightness = baseColorObj.oklch.l
      const chroma = baseColorObj.oklch.c

      if (lightness > 0.8 && chroma < 0.3) {
        // daylight - prevent over-darkening
        baseVariations = {
          dark: { l: Math.max(-0.25, 0.15 - lightness), c: 1.0 },
        }
        triadVariations = {
          first: {
            pure: { l: -0.05, c: 0.85 },
            muted: { l: 0.1, c: 0.6 },
          },
          second: {
            pure: { l: -0.15, c: 0.8 },
            muted: { l: -0.25, c: 0.5 },
          },
        }
      } else if (chroma > 0.8 && lightness < 0.4) {
        // dramatic - ensure visibility
        baseVariations = {
          dark: { l: Math.max(-0.2, 0.15 - lightness), c: 1.3 },
        }
        triadVariations = {
          first: {
            pure: { l: 0.25, c: 1.0 },
            muted: { l: 0.15, c: 0.8 },
          },
          second: {
            pure: { l: 0.35, c: 1.1 },
            muted: { l: 0.1, c: 0.75 },
          },
        }
      }
    }
    const initialColors: Color[] = []

    // For each of the 3 triadic hues, create 2 variations
    triadicHues.forEach((hue, triadIndex) => {
      if (triadIndex === 0) {
        // Base color family: original (preserved) + darker variant
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
        // Other triadic families: pure + muted variant
        const isFirstTriad = triadIndex === 1
        const variations = isFirstTriad ? triadVariations.first : triadVariations.second

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

    // Apply enhancements if enabled
    const finalColors = enhanced
      ? polishPalette(applyEnhancementsToTriadic(initialColors, style, 0), 0) // Base is at index 0
      : initialColors

    // Convert to your color factory format
    const colors: BaseColorData[] = []
    finalColors.forEach((color, index) => {
      if (index === 0) {
        colors.push(colorFactory(baseColor, 'triadic', index, format, true))
      } else {
        colors.push(colorFactory(color, 'triadic', index, format))
      }
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate triadic colors for ${baseColor}: ${e}`)
  }
}
