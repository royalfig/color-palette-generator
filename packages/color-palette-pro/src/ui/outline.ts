import Color from 'colorjs.io'
import { SurfaceTreatment } from '../types/types'
import { DEFAULT_TREATMENT } from './uiConst'
import { ensureContrast } from './uiUtils'

export function generateOutlineAndInverse(
  primary: Color,
  isDarkMode: boolean,
  surface: Color,
  onSurface: Color,
  treatment: SurfaceTreatment = DEFAULT_TREATMENT,
): {
  outline: Color
  outlineVariant: Color
  inverseSurface: Color
  onInverseSurface: Color
} {
  const outlineBase = primary.clone()
  outlineBase.oklch.c = 0.005

  // outlineContrast pushes the lines further from the surface lightness (diamond → harder,
  // more visible borders for the brutalist read); 0 leaves the calm default.
  const contrastDir = isDarkMode ? 1 : -1

  // Light-mode outline was L 0.50 — that is Radix step-11 *text* lightness (slate11 = 0.502)
  // being used as a step-7 border, so every border read as a hairline of body text. 0.66 puts it
  // in the border band. Dark mode was already correct and is unchanged.
  const outline = outlineBase.clone()
  outline.oklch.l = (isDarkMode ? 0.6 : 0.66) + contrastDir * treatment.outlineContrast
  const outlineAdjusted = ensureContrast(outline, surface, 3.0)

  // outline-variant: decorative dividers. Light mode was 0.92 — below Radix slate6, measuring
  // 1.04-1.37:1 against the surface, i.e. not visible at all. 0.858 lands it on the divider band.
  const outlineVariant = outlineBase.clone()
  outlineVariant.oklch.l = (isDarkMode ? 0.35 : 0.858) + contrastDir * treatment.outlineContrast * 1.5

  // Inverse colors (snackbars, etc.): a whisper of the brand tint so they stay in the same
  // family as the rest of the (tinted-neutral) surfaces rather than reading as a foreign pure
  // grey. The chroma is tiny, so the inverse contrast is unaffected. (Audit 4H.)
  const inverseSurface = onSurface.clone()
  inverseSurface.oklch.h = primary.oklch.h ?? inverseSurface.oklch.h
  inverseSurface.oklch.c = isDarkMode ? 0.006 : 0.008

  const onInverseSurface = surface.clone()
  onInverseSurface.oklch.h = primary.oklch.h ?? onInverseSurface.oklch.h
  onInverseSurface.oklch.c = isDarkMode ? 0.008 : 0.006

  return {
    outline: outlineAdjusted,
    outlineVariant,
    inverseSurface,
    onInverseSurface,
  }
}
