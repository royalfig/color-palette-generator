import Color from 'colorjs.io'
import type { BaseColorData, CodeThemeTemplate, SurfaceBundle, SyntaxColors } from '../types'
import { adaptLightnessForText, adaptLightnessForQuiet, mixColors, shiftHue, tintTowardHue, boostChroma } from '../utils'

/**
 * Split-complementary — triangle of base + two adjacent-to-complement hues.
 * Swatch layout: c0=base, c1=dark base, c2=first split pure, c3=first split muted,
 *                c4=second split pure, c5=second split muted.
 */
export const splitComplementaryTemplate: CodeThemeTemplate = {
  displayName: 'Split Complementary',

  deriveColors(baseColor: Color, palette: BaseColorData[], isDarkMode: boolean, surfaces: SurfaceBundle): SyntaxColors {
    const c0 = palette[0]?.color ?? baseColor
    const c1 = palette[1]?.color ?? c0
    const c2 = palette[2]?.color ?? c0
    const c3 = palette[3]?.color ?? c2
    const c4 = palette[4]?.color ?? c0
    const c5 = palette[5]?.color ?? c4

    const definitionColor = adaptLightnessForText(c0, isDarkMode)
    const keywordColor = adaptLightnessForText(c2, isDarkMode)
    const typeColor = adaptLightnessForText(c4, isDarkMode)
    const stringColor = adaptLightnessForText(c3, isDarkMode)
    const numberColor = adaptLightnessForText(c5, isDarkMode)
    const regexColor = adaptLightnessForText(shiftHue(c2, 20), isDarkMode)
    const accentColor = adaptLightnessForText(boostChroma(mixColors(c2, c4, 0.5), 1.15), isDarkMode)

    const baseHue = c0.oklch.h ?? 0
    const variableColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurface, baseHue, 0.4), isDarkMode)
    const propertyColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, baseHue, 0.5, 0.016), isDarkMode)
    const operatorColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outline, (c2.oklch.h ?? baseHue), 0.3, 0.012), isDarkMode)
    const punctuationColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outlineVariant, baseHue, 0.2, 0.008), isDarkMode)
    const commentColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, c1.oklch.h ?? baseHue, 0.4, 0.012), isDarkMode)

    return {
      definitionColor, keywordColor, typeColor, stringColor, numberColor, regexColor, accentColor,
      variableColor, propertyColor, operatorColor, punctuationColor, commentColor,
    }
  },

  deriveBracketPairs(baseColor: Color, palette: BaseColorData[]): Color[] {
    const get = (i: number): Color => palette[i]?.color ?? palette[0]?.color ?? baseColor
    return [get(0), get(2), get(4), get(3), get(5), get(1)]
  },
}
