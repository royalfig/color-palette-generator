import Color from 'colorjs.io'
import type { BaseColorData, CodeThemeTemplate, SurfaceBundle, SyntaxColors } from '../types'
import { adaptLightnessForText, adaptLightnessForQuiet, shiftHue, mixColors, boostChroma, tintTowardHue } from '../utils'

/**
 * Tints & Shades — single hue across a full L spectrum (12 steps).
 * Identity: monochromatic with a 180° pop on the accent/comment (moonlight signature).
 * Loud roles use deterministic hue stamps (relative to base) so they remain distinct
 * after L clamping; quiet roles stay on base hue.
 *
 * Swatch layout: index 0 = darkest, 11 = brightest, base near middle.
 */

// Deterministic hue offsets for loud roles, relative to base hue.
// Modest spread (~80°) so the family identity stays cohesive even across distinction.
const TAS_HUE_STAMPS = {
  definition: 0,
  string: 20,
  keyword: -25,
  type: 40,
  number: -45,
  regex: 60,
  accent: 180, // The signature pop — comment uses the same family for consistency.
} as const

export const tintsAndShadesTemplate: CodeThemeTemplate = {
  displayName: 'Tints & Shades',

  deriveColors(baseColor: Color, palette: BaseColorData[], isDarkMode: boolean, surfaces: SurfaceBundle): SyntaxColors {
    // Pick from the L band that fits the mode (upper for dark, lower for light).
    const pick = (darkIdx: number, lightIdx: number): Color => {
      const idx = isDarkMode ? darkIdx : lightIdx
      return palette[idx]?.color ?? palette[0]?.color ?? baseColor
    }

    const baseSwatch = pick(8, 3)
    const baseHue = baseSwatch.oklch.h ?? 0
    const stamp = (source: Color, offset: number): Color => {
      const c = source.clone()
      c.oklch.h = (baseHue + offset + 360) % 360
      return c
    }

    const definitionColor = adaptLightnessForText(stamp(baseSwatch, TAS_HUE_STAMPS.definition), isDarkMode)
    const stringColor = adaptLightnessForText(stamp(pick(6, 5), TAS_HUE_STAMPS.string), isDarkMode)
    const keywordColor = adaptLightnessForText(stamp(pick(9, 2), TAS_HUE_STAMPS.keyword), isDarkMode)
    const typeColor = adaptLightnessForText(stamp(pick(7, 4), TAS_HUE_STAMPS.type), isDarkMode)
    const numberColor = adaptLightnessForText(stamp(pick(10, 1), TAS_HUE_STAMPS.number), isDarkMode)
    const regexColor = adaptLightnessForText(stamp(baseSwatch, TAS_HUE_STAMPS.regex), isDarkMode)
    // Accent + comment share the 180° pop hue — the moonlight signature.
    const accentColor = adaptLightnessForText(boostChroma(stamp(baseSwatch, TAS_HUE_STAMPS.accent), 1.1), isDarkMode)

    const variableColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurface, baseHue, 0.4), isDarkMode)
    const propertyColor = adaptLightnessForQuiet(mixColors(surfaces.onSurfaceVariant, baseSwatch, 0.3), isDarkMode)
    const operatorColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outline, baseHue, 0.3, 0.012), isDarkMode)
    const punctuationColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outlineVariant, baseHue, 0.2, 0.008), isDarkMode)
    const commentColor = adaptLightnessForQuiet(shiftHue(pick(7, 4), TAS_HUE_STAMPS.accent), isDarkMode)

    return {
      definitionColor, keywordColor, typeColor, stringColor, numberColor, regexColor, accentColor,
      variableColor, propertyColor, operatorColor, punctuationColor, commentColor,
    }
  },

  deriveBracketPairs(baseColor: Color, palette: BaseColorData[]): Color[] {
    const get = (i: number): Color => palette[i]?.color ?? palette[0]?.color ?? baseColor
    return [get(2), get(4), get(6), get(7), get(9), get(10)]
  },
}
