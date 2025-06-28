import { ColorSpace } from '../types'
import { BaseColorData, colorFactory } from './factory'

function seededRandom(seed: number): number {
  // Simple deterministic pseudo-random number generator
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

function sineModifier(palette: BaseColorData[], modifier: number): BaseColorData[] {
  const intensity = mapRange(modifier, 0, 100, 0, 120) // 0-120 degree range

  return palette.map((color, idx) => {
    if (color.isBase) {
      return color
    }

    // Create sine wave based on position in palette
    const wavePosition = (idx / (palette.length - 1)) * Math.PI * 2
    const sineValue = Math.sin(wavePosition + modifier * 0.01) // Phase shift based on modifier
    const hueShift = sineValue * intensity

    const newColor = color.color.clone()
    const currentHue = newColor.oklch.h || 0
    newColor.oklch.h = (currentHue + hueShift) % 360

    return colorFactory(newColor, color.code.split('-')[0], idx, color.colorSpace as ColorSpace, false)
  })
}

function waveModifier(palette: BaseColorData[], modifier: number): BaseColorData[] {
  const chaosLevel = mapRange(modifier, 0, 100, 0.1, 3.0)

  return palette.map((color, idx) => {
    if (color.isBase) {
      return color
    }

    // Logistic map for chaotic behavior
    let x = 0.5 + (idx / palette.length) * 0.4 // Initial value
    for (let i = 0; i < 10; i++) {
      x = chaosLevel * x * (1 - x)
    }

    // Apply chaotic value to multiple properties
    const hueShift = (x - 0.5) * 180
    const lightnessShift = (x - 0.5) * 0.2
    const chromaMultiplier = 0.5 + x

    const newColor = color.color.clone()
    const currentHue = newColor.oklch.h || 0
    const currentLightness = newColor.oklch.l || 0.5
    const currentChroma = newColor.oklch.c || 0

    newColor.oklch.h = (currentHue + hueShift) % 360
    newColor.oklch.l = Math.max(0.05, Math.min(0.95, currentLightness + lightnessShift))
    newColor.oklch.c = Math.max(0, Math.min(0.4, currentChroma * chromaMultiplier))

    return colorFactory(newColor, color.code.split('-')[0], idx, color.colorSpace as ColorSpace, false)
  })
}

function zapModifier(palette: BaseColorData[], modifier: number): BaseColorData[] {
  const spiralTightness = mapRange(modifier, 0, 100, 0.1, 2.0)

  return palette.map((color, idx) => {
    if (color.isBase) {
      return color
    }

    // Logarithmic spiral formula
    const angle = idx * spiralTightness
    const radius = Math.log(idx + 1) * 10

    // Apply spiral to hue and chroma
    const hueShift = (angle * 57.2958) % 360 // Convert to degrees
    const chromaShift = Math.sin(radius * 0.1) * 0.1

    const newColor = color.color.clone()
    const currentHue = newColor.oklch.h || 0
    const currentChroma = newColor.oklch.c || 0

    newColor.oklch.h = (currentHue + hueShift) % 360
    newColor.oklch.c = Math.max(0, Math.min(0.4, currentChroma + chromaShift))

    return colorFactory(newColor, color.code.split('-')[0], idx, color.colorSpace as ColorSpace, false)
  })
}

function blockModifier(palette: BaseColorData[], modifier: number): BaseColorData[] {
  const amplitude = mapRange(modifier, 0, 100, 0, 0.3) // Lightness variation range

  return palette.map((color, idx) => {
    if (color.isBase) {
      return color
    }

    // Create triangular wave for more dramatic effect
    const wavePosition = (idx / (palette.length - 1)) * Math.PI * 4 // Double frequency
    const triangleWave = (2 / Math.PI) * Math.asin(Math.sin(wavePosition))
    const lightnessShift = triangleWave * amplitude

    const newColor = color.color.clone()
    const currentLightness = newColor.oklch.l || 0.5
    newColor.oklch.l = Math.max(0.05, Math.min(0.95, currentLightness + lightnessShift))

    return colorFactory(newColor, color.code.split('-')[0], idx, color.colorSpace as ColorSpace, false)
  })
}

export function paletteModulator(palette: BaseColorData[], modulateValues: number[]): BaseColorData[] {
  let modulatedPalette = [...palette] // Create copy to avoid mutation

  if (modulateValues[0] && modulateValues[0] !== 0) {
    modulatedPalette = sineModifier(modulatedPalette, modulateValues[0])
  }

  if (modulateValues[1] && modulateValues[1] !== 0) {
    modulatedPalette = waveModifier(modulatedPalette, modulateValues[1])
  }

  if (modulateValues[2] && modulateValues[2] !== 0) {
    modulatedPalette = zapModifier(modulatedPalette, modulateValues[2])
  }

  if (modulateValues[3] && modulateValues[3] !== 0) {
    modulatedPalette = blockModifier(modulatedPalette, modulateValues[3])
  }

  return modulatedPalette
}
