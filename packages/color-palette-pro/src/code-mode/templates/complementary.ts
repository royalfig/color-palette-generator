import Color from 'colorjs.io'
import type { BaseColorData, CodeThemeTemplate, SurfaceBundle, SyntaxColors } from '../types'
import { adaptLightnessForText, adaptLightnessForQuiet, mixColors, shiftHue, tintTowardHue, boostChroma } from '../utils'

/**
 * Complementary — maximum two-hue tension.
 * Swatch layout: c0=base, c1=main complement, c2=dark base, c3=light base, c4=light complement, c5=muted complement.
 * Identity: base hue carries the structural meaning, complement carries the syntactic energy.
 */
export const complementaryTemplate: CodeThemeTemplate = {
  displayName: 'Complementary Contrast',

  deriveColors(baseColor: Color, palette: BaseColorData[], isDarkMode: boolean, surfaces: SurfaceBundle): SyntaxColors {
    const c0 = palette[0]?.color ?? baseColor
    const c1 = palette[1]?.color ?? c0
    const c3 = palette[3]?.color ?? c0
    const c4 = palette[4]?.color ?? c1
    const c5 = palette[5]?.color ?? c1

    const definitionColor = adaptLightnessForText(c0, isDarkMode)
    const keywordColor = adaptLightnessForText(c1, isDarkMode)
    const typeColor = adaptLightnessForText(c4, isDarkMode)
    const stringColor = adaptLightnessForText(c3, isDarkMode)
    const numberColor = adaptLightnessForText(c5, isDarkMode)
    const regexColor = adaptLightnessForText(shiftHue(c1, -25), isDarkMode)
    const accentColor = adaptLightnessForText(boostChroma(c1.clone(), 1.2), isDarkMode)

    const baseHue = c0.oklch.h ?? 0
    const compHue = c1.oklch.h ?? baseHue
    const variableColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurface, baseHue, 0.4), isDarkMode)
    const propertyColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, baseHue, 0.5, 0.016), isDarkMode)
    // Operator brings a whisper of the complement into the punctuation glue — distinguishes the theme.
    const operatorColor = adaptLightnessForQuiet(mixColors(surfaces.outline, c1, 0.3), isDarkMode)
    const punctuationColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outlineVariant, baseHue, 0.2, 0.008), isDarkMode)
    const commentColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, c3.oklch.h ?? baseHue, 0.4, 0.012), isDarkMode)

    return {
      definitionColor, keywordColor, typeColor, stringColor, numberColor, regexColor, accentColor,
      variableColor, propertyColor, operatorColor, punctuationColor, commentColor,
    }
  },

  deriveBracketPairs(baseColor: Color, palette: BaseColorData[]): Color[] {
    const get = (i: number): Color => palette[i]?.color ?? palette[0]?.color ?? baseColor
    return [get(0), get(1), get(3), get(4), get(2), get(5)]
  },
}
