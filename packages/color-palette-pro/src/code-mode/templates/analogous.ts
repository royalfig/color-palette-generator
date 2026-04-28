import Color from 'colorjs.io'
import type { BaseColorData, CodeThemeTemplate, SurfaceBundle, SyntaxColors } from '../types'
import { adaptLightnessForText, adaptLightnessForQuiet, mixColors, shiftHue, tintTowardHue, boostChroma } from '../utils'

/**
 * Analogous — serene single-hue-band harmony.
 * Identity: reading code feels like sliding along a 60° hue spectrum.
 * The most-shifted swatches do the work of keyword/type so contrast stays inside the family.
 */
export const analogousTemplate: CodeThemeTemplate = {
  displayName: 'Analogous Harmony',

  deriveColors(baseColor: Color, palette: BaseColorData[], isDarkMode: boolean, surfaces: SurfaceBundle): SyntaxColors {
    const c0 = palette[0]?.color ?? baseColor
    const c1 = palette[1]?.color ?? c0
    const c2 = palette[2]?.color ?? c0
    const c3 = palette[3]?.color ?? c0
    const c4 = palette[4]?.color ?? c0
    const c5 = palette[5]?.color ?? c4

    const definitionColor = adaptLightnessForText(c0, isDarkMode)
    const keywordColor = adaptLightnessForText(c4, isDarkMode)
    const typeColor = adaptLightnessForText(c5, isDarkMode)
    const stringColor = adaptLightnessForText(c3, isDarkMode)
    const numberColor = adaptLightnessForText(mixColors(c0, c3, 0.5), isDarkMode)
    const regexColor = adaptLightnessForText(shiftHue(c2, -25), isDarkMode)
    const accentColor = adaptLightnessForText(boostChroma(c5.clone(), 1.2), isDarkMode)

    const baseHue = c0.oklch.h ?? 0
    const farHue = c4.oklch.h ?? baseHue
    const variableColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurface, baseHue, 0.4), isDarkMode)
    const propertyColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, baseHue, 0.6, 0.018), isDarkMode)
    const operatorColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outline, farHue, 0.3, 0.01), isDarkMode)
    const punctuationColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outlineVariant, baseHue, 0.2, 0.008), isDarkMode)
    const commentColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, c1.oklch.h ?? baseHue, 0.5, 0.014), isDarkMode)

    return {
      definitionColor, keywordColor, typeColor, stringColor, numberColor, regexColor, accentColor,
      variableColor, propertyColor, operatorColor, punctuationColor, commentColor,
    }
  },

  deriveBracketPairs(baseColor: Color, palette: BaseColorData[]): Color[] {
    const get = (i: number): Color => palette[i]?.color ?? palette[0]?.color ?? baseColor
    return [get(0), get(2), get(4), get(1), get(3), get(5)]
  },
}
