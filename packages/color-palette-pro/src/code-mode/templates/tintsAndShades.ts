import Color from 'colorjs.io'
import type { BaseColorData, CodeThemeTemplate, SurfaceBundle, SyntaxColors } from '../types'
import { adaptLightnessForText, adaptLightnessForQuiet, mixColors, boostChroma, tintTowardHue } from '../utils'

/**
 * Tints & Shades — single hue across a full L spectrum (12 steps).
 * Identity: TRUE monochrome — every role is a tint / shade / tone of the base hue, separated
 * only by lightness and chroma. (The old 180° "moonlight" accent/comment pop and the ±25°
 * loud spread were dropped so the theme is literally tints/shades of the base.)
 * Loud roles draw from different L swatches so they stay distinct after the mono L-stepping;
 * quiet roles stay on the base hue too.
 *
 * Swatch layout: index 0 = darkest, 11 = brightest, base near middle.
 */

// Hue offsets are all 0 — loud roles are all the base hue, separated downstream by LIGHTNESS
// (and a little chroma), never by hue. Kept as a table for parity with the other templates.
const TAS_HUE_STAMPS = {
  definition: 0,
  string: 0,
  keyword: 0,
  type: 0,
  number: 0,
  regex: 0,
  accent: 0,
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
    // regex draws from the L extremes (11/0) so it stays distinct from definition (8/3) now
    // that hue no longer separates them.
    const regexColor = adaptLightnessForText(stamp(pick(11, 0), TAS_HUE_STAMPS.regex), isDarkMode)
    // Accent: the most saturated step of the base hue (boosted chroma), not a counter-hue.
    const accentColor = adaptLightnessForText(boostChroma(stamp(baseSwatch, TAS_HUE_STAMPS.accent), 1.1), isDarkMode)

    const variableColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurface, baseHue, 0.4), isDarkMode)
    const propertyColor = adaptLightnessForQuiet(mixColors(surfaces.onSurfaceVariant, baseSwatch, 0.3), isDarkMode)
    const operatorColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outline, baseHue, 0.3, 0.012), isDarkMode)
    const punctuationColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outlineVariant, baseHue, 0.2, 0.008), isDarkMode)
    const commentColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, baseHue, 0.5, 0.012), isDarkMode)

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
