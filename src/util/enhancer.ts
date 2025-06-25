import Color from 'colorjs.io'

// ===== CHROMA NARRATIVE SYSTEM =====
// Creates intentional saturation stories instead of uniform chroma

interface ChromaNarrative {
  pattern: number[] // Multipliers for base chroma
  description: string // What story this tells
  breathingRoom: boolean // Whether to include rest points
}

function getChromaNarrative(
  paletteType: 'analogous' | 'complementary' | 'split-complementary' | 'tetradic' | 'triadic' | 'tints-shades',
  style: 'square' | 'triangle' | 'circle' | 'diamond',
  baseChroma: number,
): ChromaNarrative {
  if (paletteType === 'analogous') {
    switch (style) {
      case 'square':
        return {
          pattern: [0.8, 0.9, 1.0, 1.0, 0.9, 0.8], // Gentle bell curve
          description: 'Mathematical harmony',
          breathingRoom: true,
        }
      case 'triangle':
        return {
          pattern: [0.7, 1.0, 0.85, 1.0, 0.75, 0.6], // Breathing rhythm
          description: 'Natural visual rhythm',
          breathingRoom: true,
        }
      case 'circle':
        return {
          pattern: [0.6, 0.9, 1.0, 1.0, 1.1, 0.8], // Emotional crescendo
          description: 'Emotional journey with climax',
          breathingRoom: false,
        }
      case 'diamond':
        return {
          pattern: [0.8, 0.7, 1.0, 0.9, 1.1, 0.6], // Light and shadow play
          description: 'Luminosity dance',
          breathingRoom: true,
        }
    }
  }

  if (paletteType === 'complementary') {
    switch (style) {
      case 'square':
        return {
          pattern: [1.0, 0.9, 0.7, 0.6, 0.8, 0.5], // Main colors pop
          description: 'Clear hierarchy',
          breathingRoom: true,
        }
      case 'triangle':
        return {
          pattern: [1.0, 0.85, 0.6, 0.5, 0.75, 0.4], // Perceptual balance
          description: 'Visual weight distribution',
          breathingRoom: true,
        }
      case 'circle':
        return {
          pattern: [1.0, 1.1, 0.8, 0.6, 0.9, 0.5], // Emotional contrast
          description: 'Emotional dialogue',
          breathingRoom: false,
        }
      case 'diamond':
        return {
          pattern: [1.0, 0.9, 0.7, 0.5, 0.8, 0.4], // Temperature story
          description: 'Light temperature narrative',
          breathingRoom: true,
        }
    }
  }

  if (paletteType === 'split-complementary') {
    switch (style) {
      case 'square':
        return {
          pattern: [1.0, 0.8, 0.9, 0.7, 0.85, 0.6], // Balanced triad
          description: 'Triadic balance',
          breathingRoom: true,
        }
      case 'triangle':
        return {
          pattern: [1.0, 0.7, 0.95, 0.6, 0.8, 0.5], // Visual triangle
          description: 'Perceptual triangle',
          breathingRoom: true,
        }
      case 'circle':
        return {
          pattern: [1.0, 0.9, 1.1, 0.8, 0.9, 0.7], // Three-act story
          description: 'Three-part emotional narrative',
          breathingRoom: false,
        }
      case 'diamond':
        return {
          pattern: [1.0, 0.8, 0.9, 0.6, 0.85, 0.5], // Split lighting
          description: 'Multi-source lighting',
          breathingRoom: true,
        }
    }
  }

  if (paletteType === 'tetradic') {
    switch (style) {
      case 'square':
        return {
          pattern: [1.0, 0.8, 0.7, 0.9, 0.75, 0.6], // Square balance
          description: 'Quadratic harmony',
          breathingRoom: true,
        }
      case 'triangle':
        return {
          pattern: [1.0, 0.7, 0.6, 0.85, 0.65, 0.5], // Visual square
          description: 'Perceptual quadrangle',
          breathingRoom: true,
        }
      case 'circle':
        return {
          pattern: [1.0, 0.9, 0.8, 1.0, 0.85, 0.7], // Four seasons
          description: 'Four-part epic',
          breathingRoom: false,
        }
      case 'diamond':
        return {
          pattern: [1.0, 0.8, 0.6, 0.9, 0.7, 0.5], // Four-point lighting
          description: 'Professional lighting setup',
          breathingRoom: true,
        }
    }
  }

  if (paletteType === 'triadic') {
    switch (style) {
      case 'square':
        return {
          pattern: [1.0, 0.8, 0.9, 0.85, 0.9, 0.7], // Balanced triangle
          description: 'Triangular harmony',
          breathingRoom: true,
        }
      case 'triangle':
        return {
          pattern: [1.0, 0.75, 0.95, 0.7, 0.85, 0.6], // Visual balance
          description: 'Perceptual triangle',
          breathingRoom: true,
        }
      case 'circle':
        return {
          pattern: [1.0, 0.9, 1.1, 0.8, 0.95, 0.75], // Three-act drama
          description: 'Three-part emotional story',
          breathingRoom: false,
        }
      case 'diamond':
        return {
          pattern: [1.0, 0.8, 0.9, 0.7, 0.85, 0.65], // Three-point lighting
          description: 'Three-source illumination',
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
  paletteType: 'analogous' | 'complementary' | 'split-complementary' | 'tetradic' | 'triadic' | 'tints-shades',
  style: 'square' | 'triangle' | 'circle' | 'diamond',
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

  if (paletteType === 'triadic') {
    return [
      { name: 'protagonist', chromaMultiplier: 1.0, lightnessShift: 0, presence: 0.5 }, // Base
      { name: 'supporting', chromaMultiplier: 0.9, lightnessShift: -0.1, presence: 0.2 }, // Dark base
      { name: 'deuteragonist', chromaMultiplier: 0.85, lightnessShift: 0.05, presence: 0.3 }, // First triad
      { name: 'neutral', chromaMultiplier: 0.65, lightnessShift: 0.08, presence: 0.15 }, // Muted first
      { name: 'accent', chromaMultiplier: 0.8, lightnessShift: 0.02, presence: 0.25 }, // Second triad
      { name: 'background', chromaMultiplier: 0.6, lightnessShift: -0.05, presence: 0.12 }, // Muted second
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
  paletteType: 'analogous' | 'complementary' | 'split-complementary' | 'tetradic' | 'tints-shades' | 'triadic',
  style: 'square' | 'triangle' | 'circle' | 'diamond',
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

export function applyEnhancementsToTriadic(colors: Color[], style: string, baseIndex: number = 0): Color[] {
  return enhancePalette(colors, 'triadic', style as any, baseIndex)
}

// ===== MUDDY ZONE AVOIDANCE =====
// Bonus: Fix muddy colors
export function avoidMuddyZones(hue: number, lightness: number, chroma: number): { h: number; l: number; c: number } {
  // Expanded zones for maximum beauty
  const mudZones = [
    { range: [25, 65], name: 'brown-olive' },
    { range: [100, 140], name: 'sick-green' },
    { range: [45, 55], name: 'dead-orange' }, // NEW
    { range: [180, 200], name: 'corpse-cyan' }, // NEW
  ]

  // More aggressive pushing out of ugly zones
  for (const zone of mudZones) {
    if (hue >= zone.range[0] && hue <= zone.range[1]) {
      // Push harder toward beautiful alternatives
      if (chroma < 0.15) {
        // Very muted: make it a sophisticated neutral
        return { h: hue, l: lightness, c: chroma * 0.5 }
      } else {
        // Push to nearest beautiful hue
        const pushDirection = hue < (zone.range[0] + zone.range[1]) / 2 ? -1 : 1
        const newHue = pushDirection > 0 ? zone.range[1] + 10 : zone.range[0] - 10
        return { h: newHue, l: lightness, c: chroma * 1.1 }
      }
    }
  }

  return { h: hue, l: lightness, c: chroma }
}

// Add this to enhancer.ts

export function polishPalette(colors: Color[], baseColorIndex: number = 0): Color[] {
  return colors.map((color, index) => {
    if (index === baseColorIndex) {
      return color
    }

    const polished = color.clone()
    const oklch = polished.oklch

    // 1. Prevent "dead" grays in mid-tones
    if (oklch.c < 0.05 && oklch.l > 0.2 && oklch.l < 0.8) {
      oklch.c = Math.max(0.08, oklch.c * 2) // Minimum life
    }

    // 2. Make very light colors more interesting
    if (oklch.l > 0.85) {
      // Add subtle tint based on the hue
      if (oklch.c < 0.04) {
        oklch.c = 0.04 // Minimum tint
      }
      // Slight warm shift for most hues (except already warm ones)
      if (oklch.h < 30 || oklch.h > 200) {
        oklch.h = (oklch.h + 3) % 360
      }
    }

    // 3. Enrich dark colors
    if (oklch.l < 0.25) {
      // Darks should be rich, not muddy
      oklch.c = Math.min(oklch.c * 1.3, 0.15) // Boost but keep in gamut

      // Very dark colors benefit from slight hue shifts toward "noble" darks
      if (oklch.l < 0.15) {
        // Push toward blue-blacks, purple-blacks, or green-blacks
        const nobleDarkShift = Math.sin((oklch.h * Math.PI) / 180) * 5
        oklch.h = (oklch.h + nobleDarkShift + 360) % 360
      }
    }

    // 4. Jewel tone enhancement for saturated mid-tones
    if (oklch.c > 0.15 && oklch.l > 0.35 && oklch.l < 0.65) {
      // The "jewel zone" - make these colors sing
      oklch.l *= 0.97 // Slightly darker
      oklch.c = Math.min(oklch.c * 1.08, 0.37) // More saturated
    }

    // 5. Fix "almost neutral" colors that look accidentally desaturated
    if (oklch.c > 0.03 && oklch.c < 0.08) {
      // Either make it clearly neutral or clearly colored
      if (index % 2 === 0 || oklch.l < 0.3 || oklch.l > 0.7) {
        // Make it neutral
        oklch.c *= 0.6
      } else {
        // Make it clearly colored
        oklch.c *= 1.5
      }
    }

    polished.oklch = oklch
    return polished
  })
}
// Add to enhancer.ts

export function addMicroVariations(color: Color, index: number, strength: number = 1.0): Color {
  const varied = color.clone()
  const oklch = varied.oklch

  // Organic micro-variations in hue (like how natural colors are never perfectly uniform)
  const hueMicroShift = Math.sin(index * 0.7 + oklch.h * 0.01) * 2 * strength

  // Subtle chroma breathing (more variation in mid-tones)
  const chromaBreathing = Math.sin(index * 1.3) * 0.015 * strength
  const chromaMultiplier = 1 + chromaBreathing * (1 - Math.abs(oklch.l - 0.5) * 2)

  // Apply variations
  oklch.h = (oklch.h + hueMicroShift + 360) % 360
  oklch.c = Math.max(0, Math.min(0.37, oklch.c * chromaMultiplier))

  varied.oklch = oklch
  return varied
}
