import Color from 'colorjs.io'
import { colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat, ColorSpace } from '../types'
import { enhancePalette, avoidMuddyZones, applyEnhancementsToAnalogous, polishPalette } from './enhancer'

function getMathematicalAnalogous(hue: number): number[] {
  // Pure mathematical - traditional analogous with 60° total spread
  return [
    hue, // base
    (hue - 30 + 360) % 360,
    (hue - 20 + 360) % 360,
    (hue - 10 + 360) % 360,
    (hue + 15) % 360,
    (hue + 30) % 360,
  ]
}

function getOpticalAnalogous(baseColor: Color): number[] {
  // Perceptual Harmony: Based on opponent process theory and how human vision actually processes color
  const oklch = baseColor.to('oklch')
  const hue = oklch.h

  if (hue >= 0 && hue < 30) {
    // Deep reds: tight progression avoiding muddy browns
    return [
      hue, // Base red
      (hue - 15 + 360) % 360, // Deep red-purple
      (hue - 8 + 360) % 360, // Wine red
      (hue + 8) % 360, // Warm red
      (hue + 20) % 360, // Red-orange
      (hue + 35) % 360, // Orange (carefully avoiding muddy zone)
    ]
  }

  if (hue >= 30 && hue < 90) {
    // Orange-yellow range: tighter spread, avoid muddy zones
    if (hue < 50) {
      // Orange territory - bias toward reds
      return [
        hue, // Base orange
        (hue - 25 + 360) % 360, // Red-orange
        (hue - 12 + 360) % 360, // Deep orange
        (hue + 10) % 360, // Light orange
        (hue + 20) % 360, // Orange-yellow
        (hue + 30) % 360, // Golden yellow
      ]
    } else {
      // Yellow territory - bias toward greens
      return [
        hue, // Base yellow
        (hue - 20 + 360) % 360, // Orange-yellow
        (hue - 10 + 360) % 360, // Deep yellow
        (hue + 8) % 360, // Light yellow
        (hue + 18) % 360, // Yellow-green
        (hue + 30) % 360, // Lime
      ]
    }
  }

  if (hue >= 120 && hue < 180) {
    // Greens: natural plant progression, tighter range
    return [
      hue, // Base green
      (hue - 25 + 360) % 360, // Blue-green
      (hue - 12 + 360) % 360, // Cool green
      (hue + 10) % 360, // Warm green
      (hue + 20) % 360, // Yellow-green
      (hue + 35) % 360, // Spring green
    ]
  }

  if (hue >= 180 && hue < 240) {
    // Cyans to blues: water/sky progression, cohesive range
    return [
      hue, // Base cyan/blue
      (hue - 20 + 360) % 360, // Deep teal
      (hue - 10 + 360) % 360, // Teal
      (hue + 8) % 360, // Sky blue
      (hue + 18) % 360, // Light blue
      (hue + 30) % 360, // Bright blue
    ]
  }

  if (hue >= 240 && hue < 300) {
    // Blues to purples: twilight progression, tighter
    return [
      hue, // Base blue-purple
      (hue - 25 + 360) % 360, // Deep blue
      (hue - 12 + 360) % 360, // Blue
      (hue + 10) % 360, // Light purple
      (hue + 20) % 360, // Purple
      (hue + 35) % 360, // Red-purple
    ]
  }

  // Magentas/purples: flower progression, cohesive
  return [
    hue, // Base magenta
    (hue - 25 + 360) % 360, // Purple
    (hue - 12 + 360) % 360, // Light purple
    (hue + 10) % 360, // Pink
    (hue + 20) % 360, // Warm pink
    (hue + 35) % 360, // Coral pink
  ]
}

function getAdaptiveAnalogous(baseColor: Color): number[] {
  // Emotional Resonance: Creates palettes that tell emotional stories
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const saturation = oklch.c
  const lightness = oklch.l

  // Determine emotional profile
  let emotionalType: string
  if (hue >= 345 || hue < 30) {
    emotionalType = 'passionate'
  } else if (hue >= 30 && hue < 90) {
    emotionalType = 'energetic'
  } else if (hue >= 90 && hue < 150) {
    emotionalType = 'natural'
  } else if (hue >= 150 && hue < 210) {
    emotionalType = 'tranquil'
  } else if (hue >= 210 && hue < 270) {
    emotionalType = 'mysterious'
  } else {
    emotionalType = 'creative'
  }

  switch (emotionalType) {
    case 'passionate':
      // Tell the story: ember → flame → fire (tighter, more cohesive)
      return [
        hue, // Base flame
        (hue - 20 + 360) % 360, // Deep ember
        (hue - 10 + 360) % 360, // Glowing coal
        (hue + 8) % 360, // Hot fire
        (hue + 18) % 360, // Radiant heat
        (hue + 30) % 360, // Orange glow
      ]

    case 'energetic':
      // Tell the story: sunrise → golden hour (focused range)
      return [
        hue, // Sunrise orange
        (hue - 25 + 360) % 360, // Dawn red-orange
        (hue - 12 + 360) % 360, // Deep orange
        (hue + 10) % 360, // Golden
        (hue + 20) % 360, // Bright yellow
        (hue + 35) % 360, // Warm yellow
      ]

    case 'tranquil':
      // Tell the story: water → sky (serene, tight range)
      return [
        hue, // Clear water
        (hue - 20 + 360) % 360, // Deep water
        (hue - 10 + 360) % 360, // Shallow water
        (hue + 8) % 360, // Misty blue
        (hue + 18) % 360, // Sky blue
        (hue + 30) % 360, // Light sky
      ]

    case 'mysterious':
      // Tell the story: shadow → midnight (dark, cohesive)
      return [
        hue, // Twilight
        (hue - 25 + 360) % 360, // Deep shadow
        (hue - 12 + 360) % 360, // Shadow
        (hue + 10) % 360, // Midnight
        (hue + 20) % 360, // Deep night
        (hue + 35) % 360, // Dream purple
      ]

    case 'natural':
      // Tell the story: forest → leaves (natural greens)
      return [
        hue, // Mature leaves
        (hue - 22 + 360) % 360, // Deep forest
        (hue - 10 + 360) % 360, // Moss
        (hue + 10) % 360, // New growth
        (hue + 20) % 360, // Sunlit leaves
        (hue + 35) % 360, // Spring green
      ]

    default: // creative
      // Tell the story: imagination → expression (focused creative)
      return [
        hue, // Creative base
        (hue - 20 + 360) % 360, // Deep inspiration
        (hue - 10 + 360) % 360, // Imagination
        (hue + 10) % 360, // Expression
        (hue + 20) % 360, // Celebration
        (hue + 35) % 360, // Joy
      ]
  }
}

function getWarmCoolAnalogous(baseColor: Color): number[] {
  // Luminosity Dance: Based on physics of light and illumination
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  const chroma = oklch.c
  const lightness = oklch.l

  // Determine light source character
  let lightType: string
  if (lightness > 0.8 && chroma < 0.3) {
    lightType = 'neutral'
  } else if (hue >= 30 && hue < 90 && lightness > 0.6) {
    lightType = 'golden'
  } else if (hue >= 180 && hue < 240 && lightness < 0.5) {
    lightType = 'cool'
  } else if (chroma > 0.8 && lightness < 0.4) {
    lightType = 'dramatic'
  } else if (hue >= 270 && hue < 330) {
    lightType = 'magical'
  } else {
    lightType = 'warm'
  }

  switch (lightType) {
    case 'golden':
      // Golden hour: warm cast with subtle variations
      return [
        hue, // True base
        (hue - 20 + 360) % 360, // Slightly cooler
        (hue - 10 + 360) % 360, // Cool-warm transition
        (hue + 8) % 360, // Warm light
        (hue + 18) % 360, // Golden light
        (hue + 30) % 360, // Sun-kissed
      ]

    case 'cool':
      // Moonlight: cool cast, cohesive blue tones
      return [
        hue, // Base
        (hue - 25 + 360) % 360, // Deep cool
        (hue - 12 + 360) % 360, // Cool shadow
        (hue + 10) % 360, // Moonlit
        (hue + 20) % 360, // Blue moonlight
        (hue + 35) % 360, // Silver-blue
      ]

    case 'magical':
      // Magical light: ethereal but cohesive
      return [
        hue, // Base
        (hue - 30 + 360) % 360, // Deep magic
        (hue - 15 + 360) % 360, // Shadow magic
        (hue + 12) % 360, // Light magic
        (hue + 25) % 360, // Bright magic
        (hue + 40) % 360, // Ethereal glow
      ]

    case 'dramatic':
      // Dramatic lighting: strong but controlled contrasts
      return [
        hue, // Dramatic base
        (hue - 35 + 360) % 360, // Deep shadow
        (hue - 18 + 360) % 360, // Dark transition
        (hue + 15) % 360, // Lit area
        (hue + 28) % 360, // Bright highlight
        (hue + 45) % 360, // Brilliant accent
      ]

    default: // neutral/warm natural light
      // Natural daylight: balanced, true colors
      return [
        hue, // True color
        (hue - 22 + 360) % 360, // Natural shadow
        (hue - 10 + 360) % 360, // Indirect light
        (hue + 8) % 360, // Direct light
        (hue + 18) % 360, // Bright light
        (hue + 30) % 360, // Reflected light
      ]
  }
}

export function generateAnalogous(
  baseColor: string,
  options: {
    chromaAdjust?: number
    style: 'square' | 'triangle' | 'circle' | 'diamond'
    colorSpace: { space: ColorSpace; format: ColorFormat }
  },
) {
  const { chromaAdjust = 0.9, style } = options
  const enhanced = style === 'square' ? false : true

  try {
    const baseColorObj = new Color(baseColor)
    const format = options.colorSpace.format

    let analogousHues: number[]

    switch (style) {
      case 'square':
        analogousHues = getMathematicalAnalogous(baseColorObj.oklch.h)
        break
      case 'triangle':
        analogousHues = getOpticalAnalogous(baseColorObj)
        break
      case 'circle':
        analogousHues = getAdaptiveAnalogous(baseColorObj)
        break
      case 'diamond':
        analogousHues = getWarmCoolAnalogous(baseColorObj)
        break
    }

    // Get base color properties for adaptive lightness
    const baseLightness = baseColorObj.oklch.l
    const baseChroma = baseColorObj.oklch.c

    // Create adaptive lightness adjustments
    function getAdaptiveVariations() {
      const targetRange = { min: 0.15, max: 0.9 }

      if (baseLightness < 0.3) {
        // Dark base: create more lighter variants
        return [
          { l: 0, c: 1.0 }, // base
          { l: 0.25, c: 0.8 },
          { l: 0.1, c: 0.9 },
          { l: 0.35, c: 0.85 },
          { l: 0.45, c: 0.7 },
          { l: 0.55, c: 0.6 },
        ]
      } else if (baseLightness > 0.7) {
        // Light base: create more darker variants
        return [
          { l: 0, c: 1.0 }, // base
          { l: -0.35, c: 0.8 },
          { l: -0.2, c: 0.9 },
          { l: -0.45, c: 0.85 },
          { l: -0.1, c: 0.7 },
          { l: 0.05, c: 0.6 },
        ]
      } else {
        // Mid-range base: balanced distribution
        return [
          { l: 0, c: 1.0 }, // base
          { l: -0.2, c: 0.8 },
          { l: -0.1, c: 0.9 },
          { l: 0.15, c: 0.85 },
          { l: 0.25, c: 0.7 },
          { l: 0.35, c: 0.6 },
        ]
      }
    }

    let variations = getAdaptiveVariations()

    if (style === 'triangle') {
      // Perceptual harmony: adjust based on base lightness
      const lightnessModifier = baseLightness < 0.4 ? 0.15 : baseLightness > 0.6 ? -0.15 : 0

      variations = [
        { l: 0, c: 1.0 }, // Base color
        { l: Math.max(-0.2 + lightnessModifier, -0.35), c: 0.65 },
        { l: -0.08 + lightnessModifier, c: 0.85 },
        { l: 0.06 + lightnessModifier, c: 0.95 },
        { l: Math.min(0.18 + lightnessModifier, 0.4), c: 0.75 },
        { l: Math.min(0.32 + lightnessModifier, 0.5), c: 0.5 },
      ]
    } else if (style === 'circle') {
      // Emotional resonance: varies by emotional type
      const hue = baseColorObj.oklch.h
      // Emotional resonance: adapt for base lightness
      const lightnessAdaptation = baseLightness < 0.4 ? 0.2 : baseLightness > 0.6 ? -0.2 : 0

      if (hue >= 345 || hue < 30) {
        // passionate - ensure visibility
        variations = [
          { l: 0, c: 1.0 }, // Base flame
          { l: Math.max(-0.25 + lightnessAdaptation, -0.4), c: 1.1 },
          { l: -0.08 + lightnessAdaptation, c: 1.0 },
          { l: 0.05 + lightnessAdaptation, c: 0.95 },
          { l: Math.min(0.15 + lightnessAdaptation, 0.35), c: 0.85 },
          { l: Math.min(0.3 + lightnessAdaptation, 0.5), c: 0.6 },
        ]
      } else if (hue >= 150 && hue < 210) {
        // tranquil - maintain serenity while ensuring range
        variations = [
          { l: 0, c: 1.0 }, // Base serenity
          { l: Math.max(-0.18 + lightnessAdaptation, -0.35), c: 0.7 },
          { l: -0.06 + lightnessAdaptation, c: 0.85 },
          { l: 0.08 + lightnessAdaptation, c: 0.9 },
          { l: Math.min(0.2 + lightnessAdaptation, 0.4), c: 0.7 },
          { l: Math.min(0.35 + lightnessAdaptation, 0.55), c: 0.45 },
        ]
      }
    } else if (style === 'diamond') {
      // Luminosity dance: varies by light type
      const hue = baseColorObj.oklch.h
      const chroma = baseColorObj.oklch.c
      const lightness = baseColorObj.oklch.l

      if (hue >= 30 && hue < 90 && lightness > 0.6) {
        // golden - prevent over-lightening
        variations = [
          { l: 0, c: 1.0 }, // Base
          { l: Math.max(-0.3, 0.15 - lightness), c: 0.6 },
          { l: -0.12, c: 0.8 },
          { l: Math.min(0.08, 0.85 - lightness), c: 1.05 },
          { l: Math.min(0.22, 0.9 - lightness), c: 0.95 },
          { l: Math.min(0.3, 0.9 - lightness), c: 0.75 },
        ]
      } else if (hue >= 180 && hue < 240 && lightness < 0.5) {
        // cool - ensure adequate lightness
        variations = [
          { l: 0, c: 1.0 }, // Base
          { l: Math.max(-0.2, 0.15 - lightness), c: 0.5 },
          { l: -0.08, c: 0.7 },
          { l: 0.1, c: 0.85 },
          { l: 0.25, c: 0.65 },
          { l: 0.35, c: 0.45 },
        ]
      }
    }

    // Create initial colors
    const initialColors = analogousHues.map((hue, index) => {
      const color = baseColorObj.clone()

      if (index === 0) {
        // Base color
        return new Color(baseColor)
      }

      const variation = variations[index]

      // Apply muddy zone avoidance if enhanced mode
      let finalHue = hue
      let finalLightness = baseColorObj.oklch.l + variation.l
      let finalChroma = baseColorObj.oklch.c * variation.c * chromaAdjust

      if (enhanced) {
        const cleaned = avoidMuddyZones(finalHue, finalLightness, finalChroma)
        finalHue = cleaned.h
        finalLightness = cleaned.l
        finalChroma = cleaned.c
      }

      const values = clampOKLCH(finalLightness, finalChroma, finalHue)
      color.oklch.l = values.l
      color.oklch.c = values.c
      color.oklch.h = values.h

      return color
    })

    // Apply enhancements if enabled
    const finalColors = enhanced
      ? polishPalette(applyEnhancementsToAnalogous(initialColors, style, 0), 0) // Base is at index 0
      : initialColors

    // Convert to your color factory format
    return finalColors.map((color, index) => {
      if (index === 0) {
        return colorFactory(baseColor, 'analogous', index, format, true)
      }
      return colorFactory(color, 'analogous', index, format)
    })
  } catch (e) {
    throw new Error(`Failed to generate analogous colors for ${baseColor}: ${e}`)
  }
}
