import Color from 'colorjs.io'
import type { BaseColorData, CodeThemeTemplate, SurfaceBundle, SyntaxColors } from '../types'
import { adaptLightnessForText, adaptLightnessForQuiet, mixColors, tintTowardHue, boostChroma } from '../utils'

/**
 * Tetradic — four hues at ~90° spacing. Maximum hue diversity.
 * Swatch layout: c0=base, c1=first tetrad pure, c2=first tetrad muted, c3=complement,
 *                c4=fourth tetrad light, c5=fourth tetrad dark.
 */
export const tetradicTemplate: CodeThemeTemplate = {
  displayName: 'Tetradic Harmony',

  deriveColors(baseColor: Color, palette: BaseColorData[], isDarkMode: boolean, surfaces: SurfaceBundle): SyntaxColors {
    const c0 = palette[0]?.color ?? baseColor
    const c1 = palette[1]?.color ?? c0
    const c2 = palette[2]?.color ?? c1
    const c3 = palette[3]?.color ?? c0
    const c4 = palette[4]?.color ?? c0
    const c5 = palette[5]?.color ?? c4

    const definitionColor = adaptLightnessForText(c0, isDarkMode)
    const keywordColor = adaptLightnessForText(c3, isDarkMode)
    const typeColor = adaptLightnessForText(c1, isDarkMode)
    const stringColor = adaptLightnessForText(c2, isDarkMode)
    const numberColor = adaptLightnessForText(c4, isDarkMode)
    const regexColor = adaptLightnessForText(c5, isDarkMode)
    const accentColor = adaptLightnessForText(boostChroma(c1.clone(), 1.2), isDarkMode)

    const baseHue = c0.oklch.h ?? 0
    const variableColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurface, baseHue, 0.4), isDarkMode)
    const propertyColor = adaptLightnessForQuiet(mixColors(surfaces.onSurfaceVariant, c0, 0.25), isDarkMode)
    const operatorColor = adaptLightnessForQuiet(mixColors(surfaces.outline, c1, 0.4), isDarkMode)
    const punctuationColor = adaptLightnessForQuiet(tintTowardHue(surfaces.outlineVariant, baseHue, 0.2, 0.008), isDarkMode)
    const commentColor = adaptLightnessForQuiet(tintTowardHue(surfaces.onSurfaceVariant, c2.oklch.h ?? baseHue, 0.4, 0.012), isDarkMode)

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
