import Color from 'colorjs.io'
import { colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat, ColorSpace } from '../types'
import { enhancePalette, avoidMuddyZones, applyEnhancementsToAnalogous, polishPalette } from './enhancer'

function getMathematicalAnalogous(hue: number): number[] {
  // Pure mathematical - rigid 30° steps
  return [
    hue, // base
    (hue - 60 + 360) % 360,
    (hue - 30 + 360) % 360,
    (hue + 30) % 360,
    (hue + 60) % 360,
    (hue + 90) % 360,
  ]
}

function getOpticalAnalogous(baseColor: Color): number[] {
  // Perceptual Harmony: Based on opponent process theory and how human vision actually processes color
  const oklch = baseColor.to('oklch')
  const hue = oklch.h

  if (hue >= 0 && hue < 30) {
    // Deep reds: follow natural progression toward purples and oranges
    // Avoid the "muddy brown" zone around 30-60°
    return [
      hue, // Base red
      (hue + 300) % 360, // Rich burgundy/wine
      (hue + 330) % 360, // Deep red-purple
      (hue + 15) % 360, // Warm red
      (hue + 45) % 360, // Red-orange (skip the muddy zone)
      (hue + 75) % 360, // Clear orange
    ]
  }

  if (hue >= 30 && hue < 90) {
    // Orange-yellow range: avoid muddy browns, use "autumn palette" principle
    return [
      hue, // Base
      (hue + 315) % 360, // Warm red (autumn)
      (hue - 15 + 360) % 360, // Rich orange-red
      (hue + 20) % 360, // Golden yellow
      (hue + 50) % 360, // Clear yellow
      (hue + 85) % 360, // Yellow-green (spring)
    ]
  }

  if (hue >= 120 && hue < 180) {
    // Greens: follow natural plant color progressions
    return [
      hue, // Base green
      (hue - 40 + 360) % 360, // Blue-green (water/shadow)
      (hue - 20 + 360) % 360, // Cool green
      (hue + 15) % 360, // Warm green
      (hue + 35) % 360, // Yellow-green (new growth)
      (hue + 60) % 360, // Lime/chartreuse
    ]
  }

  if (hue >= 180 && hue < 240) {
    // Cyans to blues: follow water/sky progressions
    return [
      hue, // Base cyan/blue
      (hue - 30 + 360) % 360, // Deep blue-green
      (hue - 15 + 360) % 360, // Teal
      (hue + 12) % 360, // Sky blue
      (hue + 30) % 360, // Bright blue
      (hue + 55) % 360, // Blue-purple
    ]
  }

  if (hue >= 240 && hue < 300) {
    // Blues to purples: follow twilight/night sky progressions
    return [
      hue, // Base blue-purple
      (hue - 45 + 360) % 360, // Deep cyan
      (hue - 20 + 360) % 360, // Blue
      (hue + 18) % 360, // Purple
      (hue + 40) % 360, // Red-purple
      (hue + 70) % 360, // Magenta
    ]
  }

  // Magentas/purples: follow sunset/flower progressions
  return [
    hue, // Base magenta
    (hue - 60 + 360) % 360, // Blue-purple
    (hue - 25 + 360) % 360, // Purple
    (hue + 20) % 360, // Pink-red
    (hue + 45) % 360, // Warm pink
    (hue + 80) % 360, // Coral/salmon
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
      // Tell the story: ember → flame → fire → heat → glow → ash
      return [
        hue, // Base flame
        (hue + 320) % 360, // Deep ember (purple-red)
        (hue + 340) % 360, // Glowing coal
        (hue + 15) % 360, // Hot fire
        (hue + 35) % 360, // Radiant heat
        (hue + 60) % 360, // Golden glow
      ]

    case 'energetic':
      // Tell the story: dawn → sunrise → golden hour → noon → warm afternoon → sunset
      return [
        hue, // Sunrise orange
        (hue + 300) % 360, // Pre-dawn purple
        (hue - 20 + 360) % 360, // Dawn red
        (hue + 25) % 360, // Golden morning
        (hue + 50) % 360, // Bright noon
        (hue + 80) % 360, // Warm lime (afternoon energy)
      ]

    case 'tranquil':
      // Tell the story: deep ocean → shallow water → reflection → mist → sky → clouds
      return [
        hue, // Clear reflection
        (hue - 25 + 360) % 360, // Deep ocean green
        (hue - 10 + 360) % 360, // Shallow water
        (hue + 12) % 360, // Misty blue
        (hue + 28) % 360, // Open sky
        (hue + 50) % 360, // Soft clouds (blue-purple)
      ]

    case 'mysterious':
      // Tell the story: abyss → shadow → twilight → midnight → dream → ethereal
      return [
        hue, // Twilight
        (hue - 40 + 360) % 360, // Deep abyss
        (hue - 18 + 360) % 360, // Shadow
        (hue + 15) % 360, // Midnight
        (hue + 35) % 360, // Dream state
        (hue + 65) % 360, // Ethereal (toward magenta)
      ]

    case 'natural':
      // Tell the story: forest floor → moss → leaves → new growth → sunlight → bloom
      return [
        hue, // Mature leaves
        (hue - 35 + 360) % 360, // Deep forest (blue-green)
        (hue - 15 + 360) % 360, // Moss
        (hue + 18) % 360, // New growth
        (hue + 40) % 360, // Sunlit leaves
        (hue + 70) % 360, // Flower bloom (yellow)
      ]

    default: // creative
      // Tell the story: inspiration → imagination → creation → expression → celebration → transcendence
      return [
        hue, // Creative base
        (hue - 30 + 360) % 360, // Deep inspiration (blue)
        (hue - 12 + 360) % 360, // Imagination
        (hue + 20) % 360, // Expression
        (hue + 45) % 360, // Celebration (pink)
        (hue + 75) % 360, // Transcendence (coral/orange)
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
      // Golden hour: everything gets warm cast, shadows go purple-blue
      const warmShift = 15
      const shadowShift = -120
      return [
        hue, // True base
        (hue + shadowShift + 360) % 360, // Cool shadow
        (hue + shadowShift / 2 + 360) % 360, // Transitional shadow
        (hue - warmShift / 3 + 360) % 360, // Slightly cool base
        (hue + warmShift / 2) % 360, // Warmed by light
        (hue + warmShift) % 360, // Fully sun-kissed
      ]

    case 'cool':
      // Moonlight: desaturated, cool cast, blue-silver illumination
      const coolShift = 35
      const blueShift = 60
      return [
        hue, // Base
        (hue - coolShift * 1.5 + 360) % 360, // Deep cool shadow
        (hue - coolShift + 360) % 360, // Cool mid-tone
        (hue + coolShift / 3) % 360, // Slight warm reflection
        (hue + blueShift / 2) % 360, // Blue moonlight
        (hue + blueShift) % 360, // Silver-blue highlight
      ]

    case 'magical':
      // Magical/artificial light: creates impossible but beautiful combinations
      const magicShift1 = 45
      const magicShift2 = 90
      return [
        hue, // Base
        (hue + 180) % 360, // Complementary magic shadow
        (hue - magicShift1 + 360) % 360, // Cool magic
        (hue + magicShift1 / 2) % 360, // Subtle magic influence
        (hue + magicShift1) % 360, // Strong magic influence
        (hue + magicShift2) % 360, // Pure magic highlight
      ]

    case 'dramatic':
      // Dramatic lighting: strong contrasts, deep shadows, brilliant highlights
      const dramaticSpread = 70
      return [
        hue, // Dramatic base
        (hue + 200 + 360) % 360, // Deep contrasting shadow
        (hue - dramaticSpread / 2 + 360) % 360, // Dark transition
        (hue + dramaticSpread / 3) % 360, // Lit area
        (hue + dramaticSpread / 2) % 360, // Bright highlight
        (hue + dramaticSpread) % 360, // Brilliant accent
      ]

    default: // neutral/warm natural light
      // Natural daylight: balanced, true colors with subtle atmospheric effects
      const naturalSpread = 25
      return [
        hue, // True color
        (hue - naturalSpread * 1.5 + 360) % 360, // Natural shadow
        (hue - naturalSpread / 2 + 360) % 360, // Indirect light
        (hue + naturalSpread / 3) % 360, // Direct light
        (hue + naturalSpread / 2) % 360, // Bright light
        (hue + naturalSpread) % 360, // Reflected light
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

    // Style-specific lightness/chroma variations
    let variations = [
      { l: 0, c: 1.0 }, // base
      { l: 0.15, c: 0.8 },
      { l: -0.05, c: 0.9 },
      { l: 0.1, c: 0.85 },
      { l: 0.2, c: 0.7 },
      { l: 0.3, c: 0.6 },
    ]

    if (style === 'triangle') {
      // Perceptual harmony: natural atmospheric variations
      variations = [
        { l: 0, c: 1.0 }, // Base color
        { l: -0.2, c: 0.65 }, // Deep shadow (less saturated)
        { l: -0.08, c: 0.85 }, // Mid shadow
        { l: 0.06, c: 0.95 }, // Slight highlight
        { l: 0.18, c: 0.75 }, // Bright highlight (atmospheric)
        { l: 0.32, c: 0.5 }, // Atmospheric highlight (very desaturated)
      ]
    } else if (style === 'circle') {
      // Emotional resonance: varies by emotional type
      const hue = baseColorObj.oklch.h
      if (hue >= 345 || hue < 30) {
        // passionate
        variations = [
          { l: 0, c: 1.0 }, // Base flame
          { l: -0.25, c: 1.1 }, // Smoldering ember
          { l: -0.08, c: 1.0 }, // Glowing coal
          { l: 0.05, c: 0.95 }, // Bright fire
          { l: 0.15, c: 0.85 }, // Radiant glow
          { l: 0.3, c: 0.6 }, // Soft afterglow
        ]
      } else if (hue >= 150 && hue < 210) {
        // tranquil
        variations = [
          { l: 0, c: 1.0 }, // Base serenity
          { l: -0.18, c: 0.7 }, // Deep calm
          { l: -0.06, c: 0.85 }, // Gentle depth
          { l: 0.08, c: 0.9 }, // Peaceful light
          { l: 0.2, c: 0.7 }, // Soft luminosity
          { l: 0.35, c: 0.45 }, // Ethereal mist
        ]
      }
    } else if (style === 'diamond') {
      // Luminosity dance: varies by light type
      const hue = baseColorObj.oklch.h
      const chroma = baseColorObj.oklch.c
      const lightness = baseColorObj.oklch.l

      if (hue >= 30 && hue < 90 && lightness > 0.6) {
        // golden
        variations = [
          { l: 0, c: 1.0 }, // Base
          { l: -0.3, c: 0.6 }, // Deep warm shadow
          { l: -0.12, c: 0.8 }, // Transition shadow
          { l: 0.08, c: 1.05 }, // Warm light boost
          { l: 0.22, c: 0.95 }, // Golden highlight
          { l: 0.4, c: 0.75 }, // Sun-bleached highlight
        ]
      } else if (hue >= 180 && hue < 240 && lightness < 0.5) {
        // cool
        variations = [
          { l: 0, c: 1.0 }, // Base
          { l: -0.2, c: 0.5 }, // Deep shadow
          { l: -0.08, c: 0.7 }, // Cool shadow
          { l: 0.06, c: 0.85 }, // Moonlit
          { l: 0.15, c: 0.65 }, // Silver light
          { l: 0.25, c: 0.45 }, // Ethereal highlight
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
