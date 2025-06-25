import Color from 'colorjs.io'
import { colorFactory } from './factory'
import { detectFormat, clampOKLCH } from './utils'

export function generateMaterialUI(
  baseColor: string,
  options: {
    style: 'square' | 'triangle' | 'circle' | 'diamond'
  },
) {
  const { style } = options
  const format = detectFormat(baseColor)

  try {
    const baseColorObj = new Color(baseColor)

    // Handle achromatic colors
    if (isNaN(baseColorObj.oklch.h) || baseColorObj.oklch.c < 0.01) {
      return generateGrayscaleMaterialUI(baseColorObj, format)
    }

    // Generate the complement for secondary colors
    let complementHue: number
    switch (style) {
      case 'square':
        complementHue = (baseColorObj.oklch.h + 180) % 360
        break
      case 'triangle':
        complementHue = getVisuallyPleasingComplement(baseColorObj.oklch.h)
        break
      case 'circle':
        complementHue = getAdaptiveComplement(baseColorObj)
        break
      case 'diamond':
        complementHue = getWarmCoolComplement(baseColorObj.oklch.h)
        break
    }

    const colors: Color[] = []

    // 1. Primary (base color)
    colors.push(baseColorObj)

    // 2. On Primary (high contrast text on primary)
    const onPrimary = generateOnColor(baseColorObj)
    colors.push(onPrimary)

    // 3. Primary Container (lighter, low emphasis primary)
    const primaryContainerValues = clampOKLCH(
      Math.min(0.9, baseColorObj.oklch.l + 0.3),
      baseColorObj.oklch.c * 0.3,
      baseColorObj.oklch.h,
    )
    const primaryContainer = baseColorObj.clone()
    primaryContainer.oklch.l = primaryContainerValues.l
    primaryContainer.oklch.c = primaryContainerValues.c
    primaryContainer.oklch.h = primaryContainerValues.h
    colors.push(primaryContainer)

    // 4. On Primary Container (text on primary container)
    const onPrimaryContainer = generateOnColor(primaryContainer)
    colors.push(onPrimaryContainer)

    // 5. Secondary (complement-based)
    const secondaryValues = clampOKLCH(baseColorObj.oklch.l, baseColorObj.oklch.c * 0.8, complementHue)
    const secondary = baseColorObj.clone()
    secondary.oklch.l = secondaryValues.l
    secondary.oklch.c = secondaryValues.c
    secondary.oklch.h = secondaryValues.h
    colors.push(secondary)

    // 6. On Secondary
    const onSecondary = generateOnColor(secondary)
    colors.push(onSecondary)

    // 7. Secondary Container
    const secondaryContainerValues = clampOKLCH(
      Math.min(0.9, baseColorObj.oklch.l + 0.25),
      baseColorObj.oklch.c * 0.25,
      complementHue,
    )
    const secondaryContainer = baseColorObj.clone()
    secondaryContainer.oklch.l = secondaryContainerValues.l
    secondaryContainer.oklch.c = secondaryContainerValues.c
    secondaryContainer.oklch.h = secondaryContainerValues.h
    colors.push(secondaryContainer)

    // 8. On Secondary Container
    const onSecondaryContainer = generateOnColor(secondaryContainer)
    colors.push(onSecondaryContainer)

    // 9. Tertiary (triadic-based, 60° from primary)
    const tertiaryHue = (baseColorObj.oklch.h + 60) % 360
    const tertiaryValues = clampOKLCH(baseColorObj.oklch.l + 0.05, baseColorObj.oklch.c * 0.7, tertiaryHue)
    const tertiary = baseColorObj.clone()
    tertiary.oklch.l = tertiaryValues.l
    tertiary.oklch.c = tertiaryValues.c
    tertiary.oklch.h = tertiaryValues.h
    colors.push(tertiary)

    // 10. On Tertiary
    const onTertiary = generateOnColor(tertiary)
    colors.push(onTertiary)

    // 11. Error (standard red, but harmonized with base)
    const errorHue = style === 'triangle' ? 15 : 0 // Slightly orange-red for triangle
    const errorValues = clampOKLCH(0.5, 0.15, errorHue)
    const error = new Color('oklch', [errorValues.l, errorValues.c, errorValues.h])
    colors.push(error)

    // 12. On Error
    const onError = generateOnColor(error)
    colors.push(onError)

    return colors.map((color, index) => colorFactory(color.to('srgb'), 'material-ui', index, format).string)
  } catch (e) {
    throw new Error(`Failed to generate Material UI colors for ${baseColor}: ${e}`)
  }
}

function generateOnColor(backgroundColor: Color): Color {
  // Generate high contrast text color (black or white)
  const bgLightness = backgroundColor.oklch.l

  if (bgLightness > 0.5) {
    // Light background: use dark text
    return new Color('oklch', [0.1, 0, 0])
  } else {
    // Dark background: use light text
    return new Color('oklch', [0.95, 0, 0])
  }
}

function generateGrayscaleMaterialUI(
  baseColor: Color,
  format: 'hex' | 'rgb' | 'hsl' | 'oklch' | 'oklab' | 'lch' | 'lab' | 'p3' | undefined,
): string[] {
  const baseLightness = baseColor.oklch.l

  // Create 12 grays with Material Design roles
  const grayValues = [
    baseLightness, // Primary (base)
    baseLightness > 0.5 ? 0.1 : 0.9, // On Primary
    Math.min(0.95, baseLightness + 0.3), // Primary Container
    baseLightness > 0.5 ? 0.15 : 0.85, // On Primary Container
    Math.max(0.05, baseLightness - 0.1), // Secondary
    baseLightness > 0.3 ? 0.1 : 0.9, // On Secondary
    Math.min(0.9, baseLightness + 0.25), // Secondary Container
    baseLightness > 0.5 ? 0.2 : 0.8, // On Secondary Container
    Math.min(0.85, baseLightness + 0.15), // Tertiary
    baseLightness > 0.4 ? 0.15 : 0.85, // On Tertiary
    0.4, // Error (standard gray error)
    0.9, // On Error
  ]

  return grayValues.map((lightness, index) => {
    const gray = baseColor.clone()
    const values = clampOKLCH(lightness, 0, 0)
    gray.oklch.l = values.l

    return colorFactory(gray, 'material-ui', index, format).string
  })
}

// Helper function for visually pleasing complement (reuse from earlier)
function getVisuallyPleasingComplement(hue: number): number {
  if (hue >= 0 && hue < 45) {
    return 120 + hue * 0.2
  }
  if (hue >= 45 && hue < 75) {
    return 160 + (hue - 45) * 0.5
  }
  if (hue >= 225 && hue < 285) {
    return 45 + (hue - 225) * 0.1
  }
  if (hue >= 45 && hue < 105) {
    return 260 + (hue - 45) * 0.3
  }
  return (hue + 180) % 360
}

// Helper functions for other styles (reuse from complementary)
function getAdaptiveComplement(baseColor: Color): number {
  const oklch = baseColor.to('oklch')
  let complement = getVisuallyPleasingComplement(oklch.h)

  if (oklch.c > 0.15) {
    complement = (complement + 10) % 360
  }

  if (oklch.l > 0.85 || oklch.l < 0.25) {
    const distance = Math.abs(complement - oklch.h)
    complement = oklch.h + distance * 0.8
  }

  return complement
}

function getWarmCoolComplement(hue: number): number {
  const adjustedHue = (hue + 180) % 360

  if (hue >= 0 && hue < 60) return (adjustedHue - 15 + 360) % 360
  if (hue >= 60 && hue < 120) return (adjustedHue + 10) % 360
  if (hue >= 240 && hue < 300) return (adjustedHue - 10 + 360) % 360

  return adjustedHue
}
