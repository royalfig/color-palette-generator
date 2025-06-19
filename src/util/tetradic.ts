import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat } from '../types'
import { ColorSpace } from '../types'
import { enhancePalette, avoidMuddyZones, applyEnhancementsToTetradic } from './enhancer'

function getMathematicalTetradic(hue: number): number[] {
  // Perfect 90° spacing forming a square
  return [hue, (hue + 90) % 360, (hue + 180) % 360, (hue + 270) % 360]
}

function getOpticalTetradic(baseColor: Color): number[] {
  // Perceptual Harmony: Based on how our visual system processes four-color relationships
  const hue = baseColor.oklch.h

  // Human vision processes tetrad relationships differently based on opponent channels
  if (hue >= 0 && hue < 45) {
    // Pure reds: create rich, balanced tetrad avoiding muddy zones
    return [
      hue, // Base red
      (hue + 75) % 360, // Orange-yellow (avoid muddy)
      (hue + 165) % 360, // Rich teal (true opponent)
      (hue + 255) % 360, // Blue-purple (harmonious fourth)
    ]
  }

  if (hue >= 45 && hue < 90) {
    // Orange-yellows: wider spacing to avoid brown zone
    return [
      hue, // Base orange/yellow
      (hue + 105) % 360, // Green (skip muddy zone)
      (hue + 195) % 360, // Blue (strong contrast)
      (hue + 285) % 360, // Purple (complete tetrad)
    ]
  }

  if (hue >= 90 && hue < 135) {
    // Yellows to yellow-greens: balanced natural tetrad
    return [
      hue, // Base yellow-green
      (hue + 85) % 360, // Blue-green
      (hue + 175) % 360, // Red-purple
      (hue + 265) % 360, // Blue-purple
    ]
  }

  if (hue >= 135 && hue < 180) {
    // Greens: follow natural color relationships
    return [
      hue, // Base green
      (hue + 80) % 360, // Cyan
      (hue + 170) % 360, // Magenta
      (hue + 280) % 360, // Purple
    ]
  }

  if (hue >= 180 && hue < 225) {
    // Cyans: create vibrant, clear tetrad
    return [
      hue, // Base cyan
      (hue + 85) % 360, // Blue
      (hue + 175) % 360, // Red
      (hue + 275) % 360, // Purple
    ]
  }

  if (hue >= 225 && hue < 270) {
    // Blues: classic, balanced tetrad
    return [
      hue, // Base blue
      (hue + 90) % 360, // Purple
      (hue + 180) % 360, // Orange (perfect complement)
      (hue + 270) % 360, // Green
    ]
  }

  if (hue >= 270 && hue < 315) {
    // Purples: rich, sophisticated tetrad
    return [
      hue, // Base purple
      (hue + 95) % 360, // Green
      (hue + 185) % 360, // Yellow
      (hue + 275) % 360, // Cyan
    ]
  }

  // Magentas: vibrant, energetic tetrad
  return [
    hue, // Base magenta
    (hue + 85) % 360, // Yellow
    (hue + 165) % 360, // Green
    (hue + 255) % 360, // Blue
  ]
}

function getAdaptiveTetradic(baseColor: Color): number[] {
  // Emotional Resonance: Creates tetrads that tell complete emotional stories
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine emotional profile and create four-part narrative
  if (hue >= 345 || hue < 30) {
    // Passionate reds → Four seasons of passion (fire, earth, water, air)
    return [
      hue, // Fire (passionate base)
      (hue + 75) % 360, // Earth (grounding warmth)
      (hue + 165) % 360, // Water (cooling balance)
      (hue + 255) % 360, // Air (ethereal elevation)
    ]
  }

  if (hue >= 30 && hue < 90) {
    // Energetic oranges/yellows → Day cycle energy (dawn, noon, dusk, night)
    const intensity = chroma * lightness
    return [
      hue, // Dawn energy
      (hue + 90 + intensity * 10) % 360, // Noon intensity
      (hue + 180) % 360, // Dusk transition
      (hue + 270 - intensity * 5) % 360, // Night rest
    ]
  }

  if (hue >= 90 && hue < 150) {
    // Natural greens → Four elements of nature (forest, sky, earth, fire)
    return [
      hue, // Forest (natural base)
      (hue + 85) % 360, // Sky (open space)
      (hue + 175) % 360, // Earth (grounding)
      (hue + 265) % 360, // Fire (life force)
    ]
  }

  if (hue >= 150 && hue < 210) {
    // Tranquil blues → Four states of water (calm, flowing, deep, ice)
    return [
      hue, // Calm water
      (hue + 80) % 360, // Flowing stream
      (hue + 170) % 360, // Deep ocean
      (hue + 280) % 360, // Ice crystal
    ]
  }

  if (hue >= 210 && hue < 270) {
    // Mysterious blues → Four times of night (twilight, midnight, dream, dawn)
    return [
      hue, // Twilight mystery
      (hue + 95) % 360, // Midnight depth
      (hue + 185) % 360, // Dream state
      (hue + 275) % 360, // Dawn awakening
    ]
  }

  // Creative purples → Four realms of imagination (magic, vision, creation, reality)
  return [
    hue, // Magic (creative base)
    (hue + 90) % 360, // Vision (clarity)
    (hue + 180) % 360, // Creation (manifestation)
    (hue + 270) % 360, // Reality (grounding)
  ]
}

function getLuminosityTetradic(baseColor: Color): number[] {
  // Luminosity Dance: Based on how four light sources interact in space
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine lighting scenario and create four-point illumination

  if (lightness > 0.8 && chroma < 0.3) {
    // Studio lighting scenario: four balanced light sources
    return [
      hue, // Key light
      (hue + 85) % 360, // Fill light (slightly cool)
      (hue + 185) % 360, // Back light (opposite temp)
      (hue + 275) % 360, // Rim light (accent)
    ]
  }

  if (hue >= 30 && hue < 90 && lightness > 0.6) {
    // Golden hour + ambient scenario: warm key with cool fill
    return [
      hue, // Golden key light
      (hue + 70) % 360, // Warm fill
      (hue + 160) % 360, // Cool shadow/back
      (hue + 250) % 360, // Deep ambient
    ]
  }

  if (hue >= 180 && hue < 240 && lightness < 0.5) {
    // Moonlight + artificial scenario: cool natural with warm artificial
    return [
      hue, // Cool moonlight
      (hue + 95) % 360, // Artificial warm light
      (hue + 175) % 360, // Candlelight
      (hue + 285) % 360, // Firelight
    ]
  }

  if (chroma > 0.8 && lightness < 0.4) {
    // Dramatic stage lighting: strong contrast four-point
    const warmCool = hue < 180 ? 1 : -1
    return [
      hue, // Primary dramatic light
      (hue + 80 * warmCool) % 360, // Side light (temperature shift)
      (hue + 160) % 360, // Back light (strong contrast)
      (hue + 260 * warmCool) % 360, // Accent light
    ]
  }

  if (hue >= 270 && hue < 330) {
    // Artificial/neon lighting: impossible but beautiful four-point
    return [
      hue, // Primary neon
      (hue + 100) % 360, // Secondary neon
      (hue + 200) % 360, // Complementary neon
      (hue + 280) % 360, // Accent neon
    ]
  }

  // Natural daylight scenario: gentle four-point illumination
  const lightInfluence = (lightness - 0.5) * 20 // -10 to +10 shift
  return [
    hue, // Primary daylight
    (hue + 90 + lightInfluence) % 360, // Fill light
    (hue + 180) % 360, // Back light
    (hue + 270 - lightInfluence) % 360, // Rim light
  ]
}

export function generateTetradic(
  baseColor: string,
  options: {
    style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { style } = options
  const format = options.colorSpace.format
  const enhanced = options.style === 'mathematical' ? false : true

  try {
    const baseColorObj = new Color(baseColor)

    let tetradicHues: number[]

    switch (style) {
      case 'mathematical':
        tetradicHues = getMathematicalTetradic(baseColorObj.oklch.h)
        break
      case 'optical':
        tetradicHues = getOpticalTetradic(baseColorObj)
        break
      case 'adaptive':
        tetradicHues = getAdaptiveTetradic(baseColorObj)
        break
      case 'warm-cool':
        tetradicHues = getLuminosityTetradic(baseColorObj)
        break
    }

    // Style-specific lightness and chroma variations
    let variations = {
      first: { pure: { l: 0.05, c: 0.9 }, muted: { l: -0.1, c: 0.6 } },
      complement: { l: 0, c: 0.95 },
      fourth: { light: { l: 0.1, c: 0.8 }, dark: { l: -0.15, c: 1.1 } },
    }

    if (style === 'optical') {
      // Perceptual harmony: natural balance
      variations = {
        first: { pure: { l: 0.08, c: 0.85 }, muted: { l: -0.08, c: 0.65 } },
        complement: { l: 0.02, c: 0.9 },
        fourth: { light: { l: 0.12, c: 0.75 }, dark: { l: -0.12, c: 0.95 } },
      }
    } else if (style === 'adaptive') {
      // Emotional resonance: varies by emotional type
      const hue = baseColorObj.oklch.h
      if (hue >= 345 || hue < 30) {
        // passionate
        variations = {
          first: { pure: { l: 0.1, c: 1.0 }, muted: { l: -0.05, c: 0.8 } },
          complement: { l: 0.15, c: 0.8 }, // Calming water
          fourth: { light: { l: 0.2, c: 0.7 }, dark: { l: -0.2, c: 1.2 } },
        }
      } else if (hue >= 150 && hue < 210) {
        // tranquil
        variations = {
          first: { pure: { l: 0.06, c: 0.8 }, muted: { l: -0.12, c: 0.5 } },
          complement: { l: 0.08, c: 0.85 }, // Warm comfort
          fourth: { light: { l: 0.15, c: 0.75 }, dark: { l: -0.1, c: 0.9 } },
        }
      }
    } else if (style === 'warm-cool') {
      // Luminosity dance: based on lighting scenario
      const lightness = baseColorObj.oklch.l
      const chroma = baseColorObj.oklch.c

      if (lightness > 0.8 && chroma < 0.3) {
        // studio lighting
        variations = {
          first: { pure: { l: 0.05, c: 0.8 }, muted: { l: -0.15, c: 0.5 } },
          complement: { l: -0.05, c: 0.85 }, // Back light contrast
          fourth: { light: { l: 0.15, c: 0.7 }, dark: { l: -0.25, c: 0.9 } },
        }
      } else if (chroma > 0.8 && lightness < 0.4) {
        // dramatic
        variations = {
          first: { pure: { l: 0.15, c: 1.1 }, muted: { l: -0.05, c: 0.8 } },
          complement: { l: 0.2, c: 1.0 }, // Strong back light
          fourth: { light: { l: 0.25, c: 0.9 }, dark: { l: -0.3, c: 1.3 } },
        }
      }
    }

    const initialColors: Color[] = []

    // Create 6 colors from 4 tetradic hues
    tetradicHues.forEach((hue, tetradIndex) => {
      if (tetradIndex === 0) {
        // Base color (preserved)
        initialColors.push(new Color(baseColor))
      } else if (tetradIndex === 1) {
        // First tetradic color + muted variant

        // Apply muddy zone avoidance if enhanced mode
        let finalHue = hue
        if (enhanced) {
          const cleaned = avoidMuddyZones(
            hue,
            baseColorObj.oklch.l + variations.first.pure.l,
            baseColorObj.oklch.c * variations.first.pure.c,
          )
          finalHue = cleaned.h
        }

        const pureValues = clampOKLCH(
          baseColorObj.oklch.l + variations.first.pure.l,
          baseColorObj.oklch.c * variations.first.pure.c,
          finalHue,
        )
        const pureColor = baseColorObj.clone()
        pureColor.oklch.l = pureValues.l
        pureColor.oklch.c = pureValues.c
        pureColor.oklch.h = pureValues.h
        initialColors.push(pureColor)

        const mutedValues = clampOKLCH(
          baseColorObj.oklch.l + variations.first.muted.l,
          baseColorObj.oklch.c * variations.first.muted.c,
          finalHue,
        )
        const mutedColor = baseColorObj.clone()
        mutedColor.oklch.l = mutedValues.l
        mutedColor.oklch.c = mutedValues.c
        mutedColor.oklch.h = mutedValues.h
        initialColors.push(mutedColor)
      } else if (tetradIndex === 2) {
        // Complement color

        // Apply muddy zone avoidance if enhanced mode
        let finalHue = hue
        if (enhanced) {
          const cleaned = avoidMuddyZones(
            hue,
            baseColorObj.oklch.l + variations.complement.l,
            baseColorObj.oklch.c * variations.complement.c,
          )
          finalHue = cleaned.h
        }

        const compValues = clampOKLCH(
          baseColorObj.oklch.l + variations.complement.l,
          baseColorObj.oklch.c * variations.complement.c,
          finalHue,
        )
        const compColor = baseColorObj.clone()
        compColor.oklch.l = compValues.l
        compColor.oklch.c = compValues.c
        compColor.oklch.h = compValues.h
        initialColors.push(compColor)
      } else if (tetradIndex === 3) {
        // Fourth tetradic color + dark variant

        // Apply muddy zone avoidance if enhanced mode
        let finalHue = hue
        if (enhanced) {
          const cleaned = avoidMuddyZones(
            hue,
            baseColorObj.oklch.l + variations.fourth.light.l,
            baseColorObj.oklch.c * variations.fourth.light.c,
          )
          finalHue = cleaned.h
        }

        const lightValues = clampOKLCH(
          baseColorObj.oklch.l + variations.fourth.light.l,
          baseColorObj.oklch.c * variations.fourth.light.c,
          finalHue,
        )
        const lightColor = baseColorObj.clone()
        lightColor.oklch.l = lightValues.l
        lightColor.oklch.c = lightValues.c
        lightColor.oklch.h = lightValues.h
        initialColors.push(lightColor)

        const darkValues = clampOKLCH(
          baseColorObj.oklch.l + variations.fourth.dark.l,
          baseColorObj.oklch.c * variations.fourth.dark.c,
          finalHue,
        )
        const darkColor = baseColorObj.clone()
        darkColor.oklch.l = darkValues.l
        darkColor.oklch.c = darkValues.c
        darkColor.oklch.h = darkValues.h
        initialColors.push(darkColor)
      }
    })

    // Apply enhancements if enabled
    const finalColors = enhanced
      ? applyEnhancementsToTetradic(initialColors, style, 0) // Base is at index 0
      : initialColors

    // Convert to your color factory format
    const colors: BaseColorData[] = []
    finalColors.forEach((color, index) => {
      if (index === 0) {
        colors.push(colorFactory(baseColor, 'tetradic', index, format, true))
      } else {
        colors.push(colorFactory(color, 'tetradic', index, format))
      }
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate tetradic colors for ${baseColor}: ${e}`)
  }
}
