import { ColorSpace } from '../types'
import { BaseColorData, colorFactory } from './factory'

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

function sineModifier(palette: BaseColorData[], modifier: number): BaseColorData[] {
  const hueIntensity = mapRange(modifier, 0, 100, 0, 45) // Reduced to 45 degrees max
  const lightnessIntensity = mapRange(modifier, 0, 100, 0, 0.15) // Add lightness variation

  return palette.map((color, idx) => {
    const wavePosition = (idx / (palette.length - 1)) * Math.PI * 2
    
    // Primary sine wave with harmonics for more organic feel
    const fundamental = Math.sin(wavePosition + modifier * 0.01)
    const harmonic = Math.sin(wavePosition * 2 + modifier * 0.005) * 0.3
    const sineValue = fundamental + harmonic
    
    const hueShift = sineValue * hueIntensity
    const lightnessShift = Math.sin(wavePosition * 1.5 + modifier * 0.008) * lightnessIntensity

    const newColor = color.color.clone()
    const currentHue = newColor.oklch.h || 0
    const currentLightness = newColor.oklch.l || 0.5
    
    newColor.oklch.h = (currentHue + hueShift) % 360
    newColor.oklch.l = Math.max(0.05, Math.min(0.95, currentLightness + lightnessShift))

    return colorFactory(newColor, color.code.split('-')[0], idx, color.colorSpace as ColorSpace, false)
  })
}

function waveModifier(palette: BaseColorData[], modifier: number): BaseColorData[] {
  const chaosLevel = mapRange(modifier, 0, 100, 2.0, 3.2) // Increased for more variation
  const hueRange = mapRange(modifier, 0, 100, 0, 120) // Increased back to 120 degrees
  const lightnessRange = mapRange(modifier, 0, 100, 0, 0.35) // Increased range

  return palette.map((color, idx) => {
    // More varied initial seeds for better chaos distribution
    let x = 0.2 + (idx / palette.length) * 0.6 + Math.sin(idx * 0.7) * 0.15
    
    // Restore more iterations for stronger chaos
    for (let i = 0; i < 8; i++) {
      x = chaosLevel * x * (1 - x)
    }
    
    // Less smoothing to preserve chaotic character
    const smoothedX = x * 0.85 + 0.5 * 0.15

    // Stronger variations while keeping some control
    const hueShift = (smoothedX - 0.5) * hueRange
    const lightnessShift = (smoothedX - 0.5) * lightnessRange
    const chromaMultiplier = 0.4 + smoothedX * 1.2 // More dramatic chroma changes

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
  const spiralTightness = mapRange(modifier, 0, 100, 0.2, 1.2) // More controlled range
  const maxHueShift = mapRange(modifier, 0, 100, 0, 90) // Maximum 90 degree shifts

  return palette.map((color, idx) => {
    // More controlled spiral with normalization
    const normalizedPos = idx / (palette.length - 1)
    const angle = normalizedPos * spiralTightness * Math.PI * 2
    const radius = Math.sqrt(normalizedPos) * 2 // Smoother growth than log
    
    // More organic spiral motion
    const spiralX = Math.cos(angle) * radius
    const spiralY = Math.sin(angle) * radius
    
    // Apply spiral to all three properties
    const hueShift = spiralX * maxHueShift
    const lightnessShift = spiralY * 0.12 // Add lightness component
    const chromaShift = Math.sin(angle * 1.5) * 0.08 // Smoother chroma variation

    const newColor = color.color.clone()
    const currentHue = newColor.oklch.h || 0
    const currentLightness = newColor.oklch.l || 0.5
    const currentChroma = newColor.oklch.c || 0

    newColor.oklch.h = (currentHue + hueShift + 360) % 360
    newColor.oklch.l = Math.max(0.05, Math.min(0.95, currentLightness + lightnessShift))
    newColor.oklch.c = Math.max(0, Math.min(0.4, currentChroma + chromaShift))

    return colorFactory(newColor, color.code.split('-')[0], idx, color.colorSpace as ColorSpace, false)
  })
}

function blockModifier(palette: BaseColorData[], modifier: number): BaseColorData[] {
  const lightnessAmplitude = mapRange(modifier, 0, 100, 0, 0.25) // Reduced max amplitude
  const hueAmplitude = mapRange(modifier, 0, 100, 0, 30) // Add hue shifts
  const chromaAmplitude = mapRange(modifier, 0, 100, 0, 0.1) // Add chroma variation

  return palette.map((color, idx) => {
    // Adaptive frequency based on palette length
    const frequency = Math.max(1, Math.floor(palette.length / 8))
    const wavePosition = (idx / (palette.length - 1)) * Math.PI * frequency
    
    // Softer triangular wave with rounded edges
    const rawTriangle = (2 / Math.PI) * Math.asin(Math.sin(wavePosition))
    const softTriangle = rawTriangle * (1 - Math.abs(rawTriangle) * 0.3) // Soften peaks
    
    // Apply to all three properties with phase shifts
    const lightnessShift = softTriangle * lightnessAmplitude
    const hueShift = Math.sin(wavePosition + Math.PI * 0.25) * rawTriangle * hueAmplitude
    const chromaShift = Math.cos(wavePosition + Math.PI * 0.5) * rawTriangle * chromaAmplitude

    const newColor = color.color.clone()
    const currentHue = newColor.oklch.h || 0
    const currentLightness = newColor.oklch.l || 0.5
    const currentChroma = newColor.oklch.c || 0

    newColor.oklch.h = (currentHue + hueShift + 360) % 360
    newColor.oklch.l = Math.max(0.05, Math.min(0.95, currentLightness + lightnessShift))
    newColor.oklch.c = Math.max(0, Math.min(0.4, currentChroma + chromaShift))

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
