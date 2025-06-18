import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from './factory'
import { clampOKLCH, detectFormat } from './utils'
import { ColorFormat } from '../types'
import { ColorSpace } from '../types'

function getMathematicalTetradic(hue: number): number[] {
  // Perfect 90° spacing forming a square
  return [hue, (hue + 90) % 360, (hue + 180) % 360, (hue + 270) % 360]
}

function getWarmCoolTetradic(hue: number): number[] {
  // Slightly asymmetric for better visual balance
  return [hue, (hue + 85) % 360, (hue + 180) % 360, (hue + 275) % 360]
}

function getVisuallyPleasingTetradic(hue: number): number[] {
  // Adobe-style adjustments for pleasing relationships
  if (hue >= 0 && hue < 60) {
    // Red-based: avoid muddy combinations
    return [hue, (hue + 80) % 360, (hue + 170) % 360, (hue + 280) % 360]
  }
  if (hue >= 60 && hue < 120) {
    // Yellow-based: wider spacing
    return [hue, (hue + 95) % 360, (hue + 185) % 360, (hue + 265) % 360]
  }
  if (hue >= 240 && hue < 300) {
    // Blue-based: tighter harmony
    return [hue, (hue + 85) % 360, (hue + 175) % 360, (hue + 285) % 360]
  }

  // Default spacing
  return [hue, (hue + 90) % 360, (hue + 180) % 360, (hue + 270) % 360]
}

function getAdaptiveTetradic(baseColor: Color): number[] {
  const oklch = baseColor.to('oklch')
  const hue = oklch.h
  let spacing = [90, 180, 270] // base spacings

  // Adapt based on color properties
  if (oklch.c > 0.25) {
    // High saturation: slightly irregular for more dynamic feel
    spacing = [85, 175, 280]
  }

  if (oklch.l > 0.8 || oklch.l < 0.25) {
    // Extreme lightness: tighter harmony
    spacing = [80, 170, 290]
  }

  // Avoid problematic combinations in yellow-orange range
  if (hue >= 30 && hue < 90) {
    spacing = [75, 165, 285]
  }

  return [hue, ...spacing.map(s => (hue + s) % 360)]
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

  try {
    const baseColorObj = new Color(baseColor)

    let tetradicHues: number[]

    switch (style) {
      case 'mathematical':
        tetradicHues = getMathematicalTetradic(baseColorObj.oklch.h)
        break
      case 'optical':
        tetradicHues = getVisuallyPleasingTetradic(baseColorObj.oklch.h)
        break
      case 'adaptive':
        tetradicHues = getAdaptiveTetradic(baseColorObj)
        break
      case 'warm-cool':
        tetradicHues = getWarmCoolTetradic(baseColorObj.oklch.h)
        break
    }

    const colors: BaseColorData[] = []

    // Create 6 colors from 4 tetradic hues
    tetradicHues.forEach((hue, tetradIndex) => {
      if (tetradIndex === 0) {
        // Base color (unchanged)
        colors.push(colorFactory(baseColor, 'tetradic', 0, format, true))
      } else if (tetradIndex === 1) {
        // First tetradic color + muted variant
        const pureValues = clampOKLCH(baseColorObj.oklch.l + 0.05, baseColorObj.oklch.c * 0.9, hue)
        const pureColor = baseColorObj.clone()
        pureColor.oklch.l = pureValues.l
        pureColor.oklch.c = pureValues.c
        pureColor.oklch.h = pureValues.h
        colors.push(colorFactory(pureColor, 'tetradic', 1, format))

        const mutedValues = clampOKLCH(baseColorObj.oklch.l - 0.1, baseColorObj.oklch.c * 0.6, hue)
        const mutedColor = baseColorObj.clone()
        mutedColor.oklch.l = mutedValues.l
        mutedColor.oklch.c = mutedValues.c
        mutedColor.oklch.h = mutedValues.h
        colors.push(colorFactory(mutedColor, 'tetradic', 2, format))
      } else if (tetradIndex === 2) {
        // Complement color (pure)
        const compValues = clampOKLCH(baseColorObj.oklch.l, baseColorObj.oklch.c * 0.95, hue)
        const compColor = baseColorObj.clone()
        compColor.oklch.l = compValues.l
        compColor.oklch.c = compValues.c
        compColor.oklch.h = compValues.h
        colors.push(colorFactory(compColor, 'tetradic', 3, format))
      } else if (tetradIndex === 3) {
        // Fourth tetradic color + dark variant
        const lightValues = clampOKLCH(baseColorObj.oklch.l + 0.1, baseColorObj.oklch.c * 0.8, hue)
        const lightColor = baseColorObj.clone()
        lightColor.oklch.l = lightValues.l
        lightColor.oklch.c = lightValues.c
        lightColor.oklch.h = lightValues.h
        colors.push(colorFactory(lightColor, 'tetradic', 4, format))

        const darkValues = clampOKLCH(baseColorObj.oklch.l - 0.15, baseColorObj.oklch.c * 1.1, hue)
        const darkColor = baseColorObj.clone()
        darkColor.oklch.l = darkValues.l
        darkColor.oklch.c = darkValues.c
        darkColor.oklch.h = darkValues.h
        colors.push(colorFactory(darkColor, 'tetradic', 5, format))
      }
    })

    return colors
  } catch (e) {
    throw new Error(`Failed to generate tetradic colors for ${baseColor}: ${e}`)
  }
}
