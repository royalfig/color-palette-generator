import Color from 'colorjs.io'

// ===== CHROMA NARRATIVE SYSTEM =====
// Creates intentional saturation stories instead of uniform chroma

interface ChromaNarrative {
  pattern: number[] // Multipliers for base chroma
  description: string // What story this tells
  breathingRoom: boolean // Whether to include rest points
}

function getChromaNarrative(
  paletteType: 'analogous' | 'complementary' | 'split-complementary' | 'tetradic' | 'tints-shades',
  style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool',
  baseChroma: number,
): ChromaNarrative {
  if (paletteType === 'analogous') {
    switch (style) {
      case 'mathematical':
        return {
          pattern: [0.8, 0.9, 1.0, 1.0, 0.9, 0.8], // Gentle bell curve
          description: 'Mathematical harmony',
          breathingRoom: true,
        }
      case 'optical':
        return {
          pattern: [0.7, 1.0, 0.85, 1.0, 0.75, 0.6], // Breathing rhythm
          description: 'Natural visual rhythm',
          breathingRoom: true,
        }
      case 'adaptive':
        return {
          pattern: [0.6, 0.9, 1.0, 1.0, 1.1, 0.8], // Emotional crescendo
          description: 'Emotional journey with climax',
          breathingRoom: false,
        }
      case 'warm-cool':
        return {
          pattern: [0.8, 0.7, 1.0, 0.9, 1.1, 0.6], // Light and shadow play
          description: 'Luminosity dance',
          breathingRoom: true,
        }
    }
  }

  if (paletteType === 'complementary') {
    switch (style) {
      case 'mathematical':
        return {
          pattern: [1.0, 0.9, 0.7, 0.6, 0.8, 0.5], // Main colors pop
          description: 'Clear hierarchy',
          breathingRoom: true,
        }
      case 'optical':
        return {
          pattern: [1.0, 0.85, 0.6, 0.5, 0.75, 0.4], // Perceptual balance
          description: 'Visual weight distribution',
          breathingRoom: true,
        }
      case 'adaptive':
        return {
          pattern: [1.0, 1.1, 0.8, 0.6, 0.9, 0.5], // Emotional contrast
          description: 'Emotional dialogue',
          breathingRoom: false,
        }
      case 'warm-cool':
        return {
          pattern: [1.0, 0.9, 0.7, 0.5, 0.8, 0.4], // Temperature story
          description: 'Light temperature narrative',
          breathingRoom: true,
        }
    }
  }

  if (paletteType === 'split-complementary') {
    switch (style) {
      case 'mathematical':
        return {
          pattern: [1.0, 0.8, 0.9, 0.7, 0.85, 0.6], // Balanced triad
          description: 'Triadic balance',
          breathingRoom: true,
        }
      case 'optical':
        return {
          pattern: [1.0, 0.7, 0.95, 0.6, 0.8, 0.5], // Visual triangle
          description: 'Perceptual triangle',
          breathingRoom: true,
        }
      case 'adaptive':
        return {
          pattern: [1.0, 0.9, 1.1, 0.8, 0.9, 0.7], // Three-act story
          description: 'Three-part emotional narrative',
          breathingRoom: false,
        }
      case 'warm-cool':
        return {
          pattern: [1.0, 0.8, 0.9, 0.6, 0.85, 0.5], // Split lighting
          description: 'Multi-source lighting',
          breathingRoom: true,
        }
    }
  }

  if (paletteType === 'tetradic') {
    switch (style) {
      case 'mathematical':
        return {
          pattern: [1.0, 0.8, 0.7, 0.9, 0.75, 0.6], // Square balance
          description: 'Quadratic harmony',
          breathingRoom: true,
        }
      case 'optical':
        return {
          pattern: [1.0, 0.7, 0.6, 0.85, 0.65, 0.5], // Visual square
          description: 'Perceptual quadrangle',
          breathingRoom: true,
        }
      case 'adaptive':
        return {
          pattern: [1.0, 0.9, 0.8, 1.0, 0.85, 0.7], // Four seasons
          description: 'Four-part epic',
          breathingRoom: false,
        }
      case 'warm-cool':
        return {
          pattern: [1.0, 0.8, 0.6, 0.9, 0.7, 0.5], // Four-point lighting
          description: 'Professional lighting setup',
          breathingRoom: true,
        }
    }
  }

  // Tints and shades - special case
  return {
    pattern: [1.2, 1.1, 1.0, 0.9, 0.8, 1.0, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3], // Rich darks, muted lights
    description: 'Atmospheric perspective',
    breathingRoom: true,
  }
}

// ===== HIERARCHY SYSTEM =====
// Establishes clear roles for each color in the palette

interface ColorRole {
  name: 'protagonist' | 'deuteragonist' | 'supporting' | 'accent' | 'background' | 'neutral'
  chromaMultiplier: number
  lightnessShift: number
  presence: number // 0-1, how much visual weight this color should have
}

function getColorHierarchy(
  paletteType: 'analogous' | 'complementary' | 'split-complementary' | 'tetradic' | 'tints-shades',
  style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool',
): ColorRole[] {
  if (paletteType === 'analogous') {
    return [
      { name: 'supporting', chromaMultiplier: 0.8, lightnessShift: -0.05, presence: 0.15 },
      { name: 'accent', chromaMultiplier: 1.0, lightnessShift: 0.02, presence: 0.1 },
      { name: 'protagonist', chromaMultiplier: 1.0, lightnessShift: 0, presence: 0.4 }, // Base color
      { name: 'protagonist', chromaMultiplier: 0.95, lightnessShift: 0, presence: 0.4 }, // Base variant
      { name: 'deuteragonist', chromaMultiplier: 0.9, lightnessShift: 0.03, presence: 0.2 },
      { name: 'background', chromaMultiplier: 0.6, lightnessShift: 0.08, presence: 0.25 },
    ]
  }

  if (paletteType === 'complementary') {
    return [
      { name: 'protagonist', chromaMultiplier: 1.0, lightnessShift: 0, presence: 0.6 }, // Base color
      { name: 'deuteragonist', chromaMultiplier: 0.95, lightnessShift: 0.05, presence: 0.3 }, // Main complement
      { name: 'supporting', chromaMultiplier: 0.8, lightnessShift: -0.1, presence: 0.15 }, // Dark base
      { name: 'neutral', chromaMultiplier: 0.5, lightnessShift: -0.05, presence: 0.2 }, // Muted base
      { name: 'supporting', chromaMultiplier: 0.7, lightnessShift: 0.08, presence: 0.12 }, // Light complement
      { name: 'background', chromaMultiplier: 0.4, lightnessShift: -0.08, presence: 0.18 }, // Muted complement
    ]
  }

  if (paletteType === 'split-complementary') {
    return [
      { name: 'protagonist', chromaMultiplier: 1.0, lightnessShift: 0, presence: 0.5 }, // Base
      { name: 'supporting', chromaMultiplier: 0.9, lightnessShift: -0.08, presence: 0.2 }, // Dark base
      { name: 'deuteragonist', chromaMultiplier: 0.85, lightnessShift: 0.03, presence: 0.25 }, // First split
      { name: 'neutral', chromaMultiplier: 0.6, lightnessShift: -0.05, presence: 0.15 }, // Muted first
      { name: 'accent', chromaMultiplier: 0.8, lightnessShift: 0.05, presence: 0.15 }, // Second split
      { name: 'background', chromaMultiplier: 0.5, lightnessShift: 0.08, presence: 0.12 }, // Muted second
    ]
  }

  if (paletteType === 'tetradic') {
    return [
      { name: 'protagonist', chromaMultiplier: 1.0, lightnessShift: 0, presence: 0.4 }, // Base
      { name: 'deuteragonist', chromaMultiplier: 0.85, lightnessShift: 0.02, presence: 0.25 }, // First tetrad
      { name: 'neutral', chromaMultiplier: 0.6, lightnessShift: -0.05, presence: 0.15 }, // Muted first
      { name: 'supporting', chromaMultiplier: 0.8, lightnessShift: 0, presence: 0.2 }, // Complement
      { name: 'accent', chromaMultiplier: 0.75, lightnessShift: 0.05, presence: 0.12 }, // Fourth tetrad
      { name: 'background', chromaMultiplier: 0.7, lightnessShift: -0.08, presence: 0.18 }, // Dark fourth
    ]
  }

  // Tints and shades - gradient hierarchy
  return Array.from({ length: 12 }, (_, i) => {
    const isBase = i === 5 || i === 6 // Assume base is in middle
    if (isBase) {
      return { name: 'protagonist', chromaMultiplier: 1.0, lightnessShift: 0, presence: 0.3 }
    }

    const distanceFromBase = Math.min(Math.abs(i - 5), Math.abs(i - 6))
    const role =
      distanceFromBase <= 1
        ? 'deuteragonist'
        : distanceFromBase <= 2
        ? 'supporting'
        : distanceFromBase <= 3
        ? 'accent'
        : 'background'

    return {
      name: role as ColorRole['name'],
      chromaMultiplier: 1.0 - distanceFromBase * 0.1,
      lightnessShift: 0,
      presence: 0.3 - distanceFromBase * 0.05,
    }
  })
}

// ===== ENHANCEMENT APPLICATION =====
// Apply both chroma narrative and hierarchy to existing colors

export function enhancePalette(
  colors: Color[],
  paletteType: 'analogous' | 'complementary' | 'split-complementary' | 'tetradic' | 'tints-shades',
  style: 'mathematical' | 'optical' | 'adaptive' | 'warm-cool',
  baseColorIndex: number = 0,
): Color[] {
  const baseColor = colors[baseColorIndex]
  const baseChroma = baseColor.oklch.c

  // Get enhancement patterns
  const chromaNarrative = getChromaNarrative(paletteType, style, baseChroma)
  const hierarchy = getColorHierarchy(paletteType, style)

  return colors.map((color, index) => {
    const enhancedColor = color.clone()

    // Skip base color - keep it unchanged
    if (index === baseColorIndex) {
      return enhancedColor
    }

    const role = hierarchy[index] || hierarchy[0] // Fallback
    const chromaPattern = chromaNarrative.pattern[index] || 1.0

    // Apply chroma narrative
    let newChroma = baseChroma * chromaPattern

    // Apply hierarchy adjustments
    newChroma *= role.chromaMultiplier

    // Apply lightness hierarchy
    let newLightness = enhancedColor.oklch.l + role.lightnessShift

    // Clamp values
    newChroma = Math.max(0, Math.min(0.37, newChroma))
    newLightness = Math.max(0.01, Math.min(0.99, newLightness))

    // Apply enhancements
    enhancedColor.oklch.c = newChroma
    enhancedColor.oklch.l = newLightness

    return enhancedColor
  })
}

// ===== INTEGRATION HELPERS =====
// Helper functions to integrate with your existing palette generators

export function applyEnhancementsToAnalogous(colors: Color[], style: string, baseIndex: number = 2): Color[] {
  return enhancePalette(colors, 'analogous', style as any, baseIndex)
}

export function applyEnhancementsToComplementary(colors: Color[], style: string, baseIndex: number = 0): Color[] {
  return enhancePalette(colors, 'complementary', style as any, baseIndex)
}

export function applyEnhancementsToSplitComplementary(colors: Color[], style: string, baseIndex: number = 0): Color[] {
  return enhancePalette(colors, 'split-complementary', style as any, baseIndex)
}

export function applyEnhancementsToTetradic(colors: Color[], style: string, baseIndex: number = 0): Color[] {
  return enhancePalette(colors, 'tetradic', style as any, baseIndex)
}

export function applyEnhancementsToTintsShades(colors: Color[], style: string, baseIndex: number): Color[] {
  return enhancePalette(colors, 'tints-shades', style as any, baseIndex)
}

// ===== MUDDY ZONE AVOIDANCE =====
// Bonus: Fix muddy colors

export function avoidMuddyZones(hue: number, lightness: number, chroma: number): { h: number; l: number; c: number } {
  // Brown/olive muddy zone (30-60°)
  if (hue >= 25 && hue <= 65 && lightness > 0.25 && lightness < 0.75 && chroma > 0.12) {
    if (lightness < 0.5) {
      // Go darker and richer (chocolate brown territory)
      return { h: hue, l: Math.min(lightness, 0.2), c: chroma * 1.3 }
    } else {
      // Jump to clear orange/gold
      return { h: Math.min(hue + 20, 85), l: lightness, c: chroma }
    }
  }

  // Yellow-green muddy zone (100-140°)
  if (hue >= 100 && hue <= 140 && lightness > 0.3 && lightness < 0.8 && chroma > 0.15) {
    if (chroma > 0.25) {
      // Very saturated: push to clear yellow or clear green
      return { h: hue < 120 ? 90 : 150, l: lightness, c: chroma }
    } else {
      // Muted: embrace the olive but make it sophisticated
      return { h: hue, l: lightness * 0.8, c: chroma * 0.7 }
    }
  }

  return { h: hue, l: lightness, c: chroma }
}
