import Color from 'colorjs.io'
import { colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat, ColorSpace } from '../types'
import { enhancePalette, avoidMuddyZones, applyEnhancementsToComplementary } from './enhancer'

export function getWarmCoolComplement(hue: number) {
  const adjustedHue = (hue + 180) % 360

  if (hue >= 0 && hue < 60) return (adjustedHue - 15 + 360) % 360 // Reds → deeper teals
  if (hue >= 60 && hue < 120) return (adjustedHue + 10) % 360 // Yellows → richer blues
  if (hue >= 240 && hue < 300) return (adjustedHue - 10 + 360) % 360 // Blues → warmer oranges

  return adjustedHue
}

function getMathematicalComplement(hue: number): number {
  // Pure mathematical - rigid 180° opposite
  return (hue + 180) % 360
}

function getOpticalComplement(baseColor: Color): number {
  // Perceptual Harmony: Based on how the human visual system processes opponent colors
  const hue = baseColor.oklch.h

  // Red-green and blue-yellow opponent channels work differently
  if (hue >= 0 && hue < 30) {
    // Pure reds: eyes expect blue-greens around 160-180°, not yellow-greens
    return 170 + hue * 0.3 // Creates rich teals/cyans
  }

  if (hue >= 30 && hue < 90) {
    // Orange-yellows: eyes expect deep blues/purples
    // Avoid muddy complements by going to rich blues
    return 240 + (hue - 30) * 0.5 // Blues to blue-purples
  }

  if (hue >= 90 && hue < 150) {
    // Greens: eyes expect magentas/reds, but shifted for visual harmony
    return 320 + (hue - 90) * 0.6 // Rich magentas to warm reds
  }

  if (hue >= 150 && hue < 210) {
    // Blue-greens to cyans: eyes expect warm reds/oranges
    return 20 + (hue - 150) * 0.4 // Warm reds to red-oranges
  }

  if (hue >= 210 && hue < 270) {
    // Blues: eyes expect oranges, but warmer than mathematical
    return 40 + (hue - 210) * 0.3 // Rich oranges
  }

  // Purples/magentas: expect yellow-greens
  return 90 + (hue - 270) * 0.4 // Yellow-greens to greens
}

function getAdaptiveComplement(baseColor: Color): number {
  // Emotional Resonance: Creates complements that enhance the emotional story
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine emotional profile and create meaningful opposition
  if (hue >= 345 || hue < 30) {
    // Passionate reds → Calming teals (emotional cooling)
    return 180 + Math.sin((hue * Math.PI) / 180) * 20 // Gentle teal variations
  }

  if (hue >= 30 && hue < 90) {
    // Energetic oranges/yellows → Mysterious deep blues (energy vs. depth)
    const intensity = chroma * lightness
    return 240 + intensity * 30 // Deeper blues for more intense oranges
  }

  if (hue >= 90 && hue < 150) {
    // Natural greens → Passionate magentas (nature vs. artifice)
    return 320 + (hue - 90) * 0.5 // Shifts from magenta to red
  }

  if (hue >= 150 && hue < 210) {
    // Tranquil blues → Warm, comforting oranges (cool vs. warm comfort)
    return 30 + Math.cos((hue * Math.PI) / 180) * 15 // Gentle orange variations
  }

  if (hue >= 210 && hue < 270) {
    // Mysterious blues → Energetic golds (mystery vs. clarity)
    return 50 + (270 - hue) * 0.4 // From gold to orange
  }

  // Creative purples → Natural greens (imagination vs. reality)
  return 100 + Math.sin(((hue - 270) * Math.PI) / 90) * 25
}

function getLuminosityComplement(baseColor: Color): number {
  // Luminosity Dance: Based on how light and shadow create natural complements
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine the lighting scenario and create realistic complements

  if (lightness > 0.8 && chroma < 0.3) {
    // Bright, desaturated = daylight scenario
    // Shadows go cool, highlights stay neutral
    return (hue + 200) % 360 // Slightly cool complement
  }

  if (hue >= 30 && hue < 90 && lightness > 0.6) {
    // Golden light scenario - shadows go deep blue-purple
    return 240 + (hue - 30) * 0.3 // Cool shadow complements
  }

  if (hue >= 180 && hue < 240 && lightness < 0.5) {
    // Cool/moonlight scenario - warm complements emerge
    return 40 + (hue - 180) * 0.4 // Warm candlelight colors
  }

  if (chroma > 0.8 && lightness < 0.4) {
    // Dramatic lighting - creates strong color temperature contrast
    const isWarm = hue < 180
    if (isWarm) {
      return (hue + 160) % 360 // Warm lights get cool complements
    } else {
      return (hue + 200) % 360 // Cool lights get warm complements
    }
  }

  if (hue >= 270 && hue < 330) {
    // Artificial/magical light - creates unnatural but beautiful complements
    return 90 + (hue - 270) * 0.6 // Complementary artificial colors
  }

  // Natural light scenario - gentle, realistic complements
  const lightInfluence = lightness * 20 - 10 // -10 to +10 degree shift
  return (hue + 180 + lightInfluence) % 360
}

export function generateComplementary(
  baseColor: string,
  options: {
    chromaAdjust?: number
    style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { chromaAdjust = 0.9 } = options
  const format = options.colorSpace.format
  const enhanced = options.style === 'mathematical' ? false : true

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
        complementHue = getMathematicalComplement(baseColorObj.oklch.h)
        break
      case 'optical':
        complementHue = getOpticalComplement(baseColorObj)
        break
      case 'adaptive':
        complementHue = getAdaptiveComplement(baseColorObj)
        break
      case 'warm-cool':
        complementHue = getLuminosityComplement(baseColorObj)
        break
    }

    // Style-specific lightness and chroma adjustments
    let baseVariations = {
      dark: { l: -0.25, c: 1.1 },
      muted: { l: -0.1, c: 0.6 },
    }

    let complementVariations = {
      main: { l: 0.1, c: 1.1 },
      light: { l: 0, c: 0.8 },
      muted: { l: -0.15, c: 0.4 },
    }

    if (options.style === 'optical') {
      // Perceptual harmony: more natural contrast relationships
      baseVariations = {
        dark: { l: -0.2, c: 0.9 }, // Less extreme darks
        muted: { l: -0.08, c: 0.7 }, // More readable muted
      }
      complementVariations = {
        main: { l: 0.05, c: 1.0 }, // Balanced main complement
        light: { l: 0.12, c: 0.75 }, // Lighter, atmospheric
        muted: { l: -0.12, c: 0.5 }, // Better muted balance
      }
    } else if (options.style === 'adaptive') {
      // Emotional resonance: varies by emotional type
      const hue = baseColorObj.oklch.h
      if (hue >= 345 || hue < 30) {
        // passionate
        baseVariations = {
          dark: { l: -0.3, c: 1.2 }, // Deep, intense
          muted: { l: -0.05, c: 0.8 }, // Smoldering
        }
        complementVariations = {
          main: { l: 0.15, c: 0.9 }, // Calming but present
          light: { l: 0.25, c: 0.6 }, // Ethereal calm
          muted: { l: -0.1, c: 0.5 }, // Deep calm
        }
      } else if (hue >= 150 && hue < 210) {
        // tranquil
        baseVariations = {
          dark: { l: -0.15, c: 0.8 }, // Gentle depth
          muted: { l: -0.12, c: 0.5 }, // Soft muted
        }
        complementVariations = {
          main: { l: 0.08, c: 1.0 }, // Warm comfort
          light: { l: 0.2, c: 0.85 }, // Cozy warmth
          muted: { l: -0.08, c: 0.6 }, // Subtle warmth
        }
      }
    } else if (options.style === 'warm-cool') {
      // Luminosity dance: based on lighting scenario
      const lightness = baseColorObj.oklch.l
      const chroma = baseColorObj.oklch.c

      if (lightness > 0.8 && chroma < 0.3) {
        // daylight
        baseVariations = {
          dark: { l: -0.35, c: 1.0 }, // Strong shadows
          muted: { l: -0.15, c: 0.7 }, // Indirect light
        }
        complementVariations = {
          main: { l: 0.05, c: 0.9 }, // Natural complement
          light: { l: 0.18, c: 0.7 }, // Atmospheric
          muted: { l: -0.2, c: 0.4 }, // Shadow complement
        }
      } else if (chroma > 0.8 && lightness < 0.4) {
        // dramatic
        baseVariations = {
          dark: { l: -0.4, c: 1.3 }, // Deep dramatic shadow
          muted: { l: -0.08, c: 0.9 }, // Stage lighting
        }
        complementVariations = {
          main: { l: 0.2, c: 1.2 }, // Dramatic highlight
          light: { l: 0.35, c: 0.9 }, // Bright stage light
          muted: { l: -0.05, c: 0.6 }, // Supporting light
        }
      }
    }

    let finalComplementHue = complementHue

    if (enhanced) {
      const cleaned = avoidMuddyZones(
        complementHue,
        baseColorObj.oklch.l + complementVariations.main.l,
        baseColorObj.oklch.c * complementVariations.main.c,
      )
      finalComplementHue = cleaned.h
    }

    // Dark base
    const darkBaseValues = clampOKLCH(
      baseColorObj.oklch.l + baseVariations.dark.l,
      baseColorObj.oklch.c * baseVariations.dark.c,
      baseColorObj.oklch.h,
    )
    darkBase.oklch.l = darkBaseValues.l
    darkBase.oklch.c = darkBaseValues.c
    darkBase.oklch.h = darkBaseValues.h

    // Muted base
    const mutedBaseValues = clampOKLCH(
      baseColorObj.oklch.l + baseVariations.muted.l,
      baseColorObj.oklch.c * baseVariations.muted.c,
      baseColorObj.oklch.h,
    )
    mutedBase.oklch.l = mutedBaseValues.l
    mutedBase.oklch.c = mutedBaseValues.c
    mutedBase.oklch.h = mutedBaseValues.h

    // Main complement
    const mainCompValues = clampOKLCH(
      baseColorObj.oklch.l + complementVariations.main.l,
      baseColorObj.oklch.c * chromaAdjust * complementVariations.main.c,
      finalComplementHue,
    )
    mainComplement.oklch.l = mainCompValues.l
    mainComplement.oklch.c = mainCompValues.c
    mainComplement.oklch.h = mainCompValues.h

    // Light complement
    const lightCompValues = clampOKLCH(
      baseColorObj.oklch.l + complementVariations.light.l,
      baseColorObj.oklch.c * complementVariations.light.c,
      finalComplementHue,
    )
    lightComplement.oklch.l = lightCompValues.l
    lightComplement.oklch.c = lightCompValues.c
    lightComplement.oklch.h = lightCompValues.h

    // Muted complement
    const mutedCompValues = clampOKLCH(
      baseColorObj.oklch.l + complementVariations.muted.l,
      baseColorObj.oklch.c * complementVariations.muted.c,
      finalComplementHue,
    )
    mutedComplement.oklch.l = mutedCompValues.l
    mutedComplement.oklch.c = mutedCompValues.c
    mutedComplement.oklch.h = mutedCompValues.h

    const initialColors = [
      new Color(baseColor), // Base (preserved)
      mainComplement, // Main complement
      darkBase, // Dark base
      mutedBase, // Muted base
      lightComplement, // Light complement
      mutedComplement, // Muted complement
    ]

    // Apply enhancements if enabled
    const finalColors = enhanced
      ? applyEnhancementsToComplementary(initialColors, options.style, 0) // Base is at index 0
      : initialColors

    // Convert to your color factory format
    return [
      colorFactory(baseColor, 'complementary', 0, format, true), // Always preserve base
      colorFactory(finalColors[1], 'complementary', 1, format),
      colorFactory(finalColors[2], 'complementary', 2, format),
      colorFactory(finalColors[3], 'complementary', 3, format),
      colorFactory(finalColors[4], 'complementary', 4, format),
      colorFactory(finalColors[5], 'complementary', 5, format),
    ]
  } catch (e) {
    throw new Error(`Failed to generate complementary colors for ${baseColor}: ${e}`)
  }
}
