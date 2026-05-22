import Color from 'colorjs.io'
import type { BaseColorData, CodeThemeTemplate, SurfaceBundle, SyntaxColors } from '../types'
import { adaptLightnessForText, adaptLightnessForQuiet, mixColors, boostChroma, tintTowardHue } from '../utils'

/**
 * Tones — near-monochromatic, descending chroma along a single hue.
 * Identity: Poimandres-style. Since the palette is single-hue, hue distinction across
 * loud roles is *stamped in deterministically* rather than relying on emergent distinction
 * enforcement downstream. Quiet roles stay on-hue (they're meant to feel of-a-piece).
 *
 * Swatch layout: c0=max chroma, c1..c10=stepping down, c11=pure gray.
 */

// Deterministic hue offsets for loud roles, relative to base hue.
// Spread across ~120° so post-gamut they remain distinct even after personality scaling.
const TONES_HUE_STAMPS = {
  definition: 0,
  string: 25,
  keyword: -30,
  type: 50,
  number: -55,
  regex: 75,
  accent: 18,
} as const

export const tonesTemplate: CodeThemeTemplate = {
  displayName: 'Tones',

  deriveColors(baseColor: Color, palette: BaseColorData[], isDarkMode: boolean, surfaces: SurfaceBundle): SyntaxColors {
    const c0 = palette[0]?.color ?? baseColor
    const c1 = palette[1]?.color ?? c0
    const c2 = palette[2]?.color ?? c1
    const c3 = palette[3]?.color ?? c2
    const c4 = palette[4]?.color ?? c3
    const c7 = palette[7]?.color ?? c4
    const c8 = palette[8]?.color ?? c7
    const c10 = palette[10]?.color ?? c8

    const baseHue = c0.oklch.h ?? 0
    const stamp = (sourceSwatch: Color, offset: number): Color => {
      const c = sourceSwatch.clone()
      c.oklch.h = (baseHue + offset + 360) % 360
      return c
    }

    // Loud roles: each gets its own hue stamp drawing chroma from a different palette tier.
    const definitionColor = adaptLightnessForText(stamp(c0, TONES_HUE_STAMPS.definition), isDarkMode)
    const stringColor = adaptLightnessForText(stamp(c1, TONES_HUE_STAMPS.string), isDarkMode)
    const keywordColor = adaptLightnessForText(stamp(c1, TONES_HUE_STAMPS.keyword), isDarkMode)
    const typeColor = adaptLightnessForText(stamp(c2, TONES_HUE_STAMPS.type), isDarkMode)
    const numberColor = adaptLightnessForText(stamp(c2, TONES_HUE_STAMPS.number), isDarkMode)
    const regexColor = adaptLightnessForText(stamp(c3, TONES_HUE_STAMPS.regex), isDarkMode)
    const accentColor = adaptLightnessForText(boostChroma(stamp(c0, TONES_HUE_STAMPS.accent), 1.15), isDarkMode)

    // Quiet roles: stay on base hue, tinted neutrals — the monochromatic identity.
    const variableColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurface, baseHue, 0.3), isDarkMode)
    const propertyColor = adaptLightnessForQuiet(mixColors(surfaces.onSurfaceVariant, c7, 0.5), isDarkMode)
    const operatorColor = adaptLightnessForQuiet(mixColors(surfaces.outline, c8, 0.4), isDarkMode)
    const punctuationColor = adaptLightnessForQuiet(mixColors(surfaces.outlineVariant, c10, 0.3), isDarkMode)
    const commentColor = adaptLightnessForQuiet(mixColors(surfaces.onSurfaceVariant, c4, 0.45), isDarkMode)

    return {
      definitionColor, keywordColor, typeColor, stringColor, numberColor, regexColor, accentColor,
      variableColor, propertyColor, operatorColor, punctuationColor, commentColor,
    }
  },

  deriveBracketPairs(baseColor: Color, palette: BaseColorData[]): Color[] {
    const get = (i: number): Color => palette[i]?.color ?? palette[0]?.color ?? baseColor
    return [get(0), get(2), get(4), get(6), get(8), get(10)]
  },
}
