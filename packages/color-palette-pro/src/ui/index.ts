import Color from 'colorjs.io'
import { BaseColorData, colorFactory } from '../factory'
import { ColorFormat, PaletteKinds, PaletteStyle } from '../types/types'
import type { DisplayGamut } from '../utils'
import { clampChromaToGamut, realizedContrast } from './colorMath'
import { selectAccentColors } from './accentColors'
import { generateOutlineAndInverse } from './outline'
import { generateSemanticColors } from './semantic'
import { generateSurfaceColors, makeContainerForAccent } from './surface'
import { adaptPrimaryForMode, findLightnessFromTarget, getAccessibleVariant, surfaceTreatmentFor } from './uiUtils'

// ===== MAIN PALETTE GENERATION =====
export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
  colorFormat: ColorFormat,
  paletteStyle: PaletteStyle = 'square',
  // Where the brand-coloured roles (primary, secondary, tertiary and their on-/container colours)
  // are realized. Outside sRGB they keep the chroma a wide-gamut screen can show, verified so that
  // the sRGB fallback passes too. Surfaces, outlines and semantics are near-neutral or
  // chroma-capped, gain nothing from it, and stay sRGB.
  gamut: DisplayGamut = 'srgb',
): BaseColorData[] {
  // Per-style surface material treatment — neutral (square) → brutalist (diamond).
  const treatment = surfaceTreatmentFor(paletteStyle)

  // No explicit tone target: adaptPrimaryForMode now keeps the seed's own lightness whenever it
  // already clears contrast against this mode's surface, and derives the other mode by matching
  // the contrast ratio. The old naturally-light/light-mode bias to Tone 0.35 was part of the
  // fixed-tone scheme that replaced the seed unconditionally, and is no longer needed.
  // Two passes: the surface stack needs a primary for its hue/chroma tint, and the primary needs
  // the real surface to verify contrast against. The provisional primary differs from the final
  // one only in lightness, which surfaces do not read, so the stack is unaffected by the swap.
  const provisionalPrimary = adaptPrimaryForMode(color, isDarkMode)

  // Step 3: Surface colors (AAA contrast) — generated before accents so surface is available
  const surfaces = generateSurfaceColors(provisionalPrimary, isDarkMode, treatment)
  const primary = adaptPrimaryForMode(color, isDarkMode, undefined, surfaces.surface, gamut)

  const onPrimary = getAccessibleVariant(primary, primary, 4.5, undefined, gamut)
  const { container: primaryContainer, onContainer: onPrimaryContainer } = makeContainerForAccent(
    primary,
    isDarkMode,
    gamut,
  )

  // Step 4: Accent colors — adapted for the current mode
  const { secondary: secondaryRaw, tertiary: tertiaryRaw } = selectAccentColors(paletteType, palette)

  // Secondary and Tertiary follow the same lightness targets as Primary (OKLCH L 0.4 light /
  // 0.8 dark, picked so the on-color lands on the opposite pole). We assign the target L and
  // then VERIFY it against the surface, searching outward only if needed — previously the L
  // was hard-assigned with no contrast check, so these were accessible only by luck of the
  // accent's chroma. (Audit 2C.1.)
  // The accent's chroma was realized at its palette lightness, so it is re-clamped at the new one.
  // Verified with the same margin over 4.5 as the primary (adaptPrimaryForMode's PASS): at exactly
  // 4.5 the float passed and the 8-bit hex shipped as low as 4.42.
  const ACCENT_PASS = 4.62
  const verifyAgainstSurface = (c: Color, targetL: number): Color => {
    const out = c.clone()
    out.oklch.l = targetL
    const realized = clampChromaToGamut(out, gamut)
    if (realizedContrast(realized, surfaces.surface, gamut) >= ACCENT_PASS) return realized
    return findLightnessFromTarget(out, surfaces.surface, ACCENT_PASS, targetL, gamut)
  }
  // Secondary and tertiary previously took the SAME lightness target, which erased the only axis
  // a single-hue palette (tints & shades) has — they came back within deltaE 0.3 of each other.
  // Offsetting the tertiary keeps a usable difference even when both sit on one hue.
  const accentTargetL = isDarkMode ? 0.8 : 0.4
  const tertiaryTargetL = isDarkMode ? 0.66 : 0.54
  // Safety net: whatever the scheme handed us, the three brand colours must be usably different.
  // The accent targets above are fixed lightnesses that never look at the primary, so a seed that
  // happens to sit near one (it keeps its own lightness now) came back with a near-duplicate
  // accent — on a single-hue palette, or a near-grey seed, where lightness is the only axis there
  // is. So the accents' lightness (the axis that survives every palette geometry) is searched
  // over its contrast-safe range — both accents JOINTLY, since placing one first can leave the
  // other no room in light mode's narrow L 0.24-0.55 band — for the most separation (capped at
  // the threshold), then the least total movement from the targets.
  const ACCENT_MIN_DELTA_E = 12
  const dE = (a: Color, b: Color): number => a.deltaEOK(b) * 100
  const placements = (c: Color): Color[] => {
    const out = [c]
    for (let l = 0.24; l <= 0.92; l += 0.02) {
      const atL = c.clone()
      atL.oklch.l = l
      const probe = clampChromaToGamut(atL, gamut)
      if (realizedContrast(probe, surfaces.surface, gamut) >= ACCENT_PASS) out.push(probe)
    }
    return out
  }
  let secondary = verifyAgainstSurface(secondaryRaw, accentTargetL)
  let tertiary = verifyAgainstSurface(tertiaryRaw, tertiaryTargetL)
  if (Math.min(dE(primary, secondary), dE(primary, tertiary), dE(secondary, tertiary)) < ACCENT_MIN_DELTA_E) {
    const sL = secondary.oklch.l ?? 0
    const tL = tertiary.oklch.l ?? 0
    const tCandidates = placements(tertiary).map(t => ({ t, fromPrimary: dE(primary, t) }))
    let bestScore = -1
    let bestMove = Infinity
    for (const s of placements(secondary)) {
      const sFromPrimary = dE(primary, s)
      for (const { t, fromPrimary } of tCandidates) {
        const score = Math.min(ACCENT_MIN_DELTA_E, sFromPrimary, fromPrimary, dE(s, t))
        const move = Math.abs((s.oklch.l ?? 0) - sL) + Math.abs((t.oklch.l ?? 0) - tL)
        if (score > bestScore + 1e-9 || (score > bestScore - 1e-9 && move < bestMove)) {
          bestScore = score
          bestMove = move
          secondary = s
          tertiary = t
        }
      }
    }
  }

  const onSecondary = getAccessibleVariant(secondary, secondary, 4.5, undefined, gamut)
  const onTertiary = getAccessibleVariant(tertiary, tertiary, 4.5, undefined, gamut)

  const { container: secondaryContainer, onContainer: onSecondaryContainer } = makeContainerForAccent(
    secondary,
    isDarkMode,
    gamut,
  )
  const { container: tertiaryContainer, onContainer: onTertiaryContainer } = makeContainerForAccent(
    tertiary,
    isDarkMode,
    gamut,
  )

  // Step 5: Outline and inverse colors
  const outlineInverse = generateOutlineAndInverse(primary, isDarkMode, surfaces.surface, surfaces.onSurface, treatment)

  // Step 6: Semantic colors (AA contrast) — clamped against surface so inline use is safe
  const semantic = generateSemanticColors(primary, palette, isDarkMode, surfaces.surface)

  const { container: errorContainer, onContainer: onErrorContainer } = makeContainerForAccent(
    semantic.error,
    isDarkMode,
  )
  const { container: successContainer, onContainer: onSuccessContainer } = makeContainerForAccent(
    semantic.success,
    isDarkMode,
  )
  const { container: warningContainer, onContainer: onWarningContainer } = makeContainerForAccent(
    semantic.warning,
    isDarkMode,
  )

  // Interaction-state & utility tokens (Audit 4C/4D — the set was previously missing every
  // hover/pressed/disabled state plus scrim/shadow, so a real UI couldn't be built from it).
  // M3 state layers = the on-color composited over the base at a fixed opacity; we bake those
  // to solid tokens (hover 8%, pressed 12%). scrim/shadow are pure black for consumers to apply
  // at their own alpha (modal backdrops, elevation shadows — the latter is what lets near-white
  // light-mode overlays read as elevated).
  const stateLayer = (base: Color, on: Color, opacity: number): Color =>
    base.clone().mix(on, opacity, { space: 'srgb', outputSpace: 'srgb' }) as Color
  const primaryHover = stateLayer(primary, onPrimary, 0.08)
  const primaryPressed = stateLayer(primary, onPrimary, 0.12)

  const scrim = new Color('oklch', [0, 0, 0])
  const shadow = new Color('oklch', [0, 0, 0])

  // Disabled: neutral, low-emphasis (hue-stripped so it reads as inactive).
  const onDisabled = surfaces.onSurfaceVariant.clone()
  onDisabled.oklch.c = 0
  onDisabled.oklch.l = isDarkMode ? 0.45 : 0.62
  const disabledContainer = surfaces.surface.clone()
  disabledContainer.oklch.c = 0
  disabledContainer.oklch.l = isDarkMode ? 0.26 : 0.93

  // Step 7: Return tokens in consistent order (count derived from the roles below, not fixed).
  return [
    // Primary colors (4)
    colorFactory(primary, 'primary', 0, colorFormat, false, true),
    colorFactory(onPrimary, 'on-primary', 0, colorFormat, false, true),
    colorFactory(primaryContainer, 'primary-container', 0, colorFormat, false, true),
    colorFactory(onPrimaryContainer, 'on-primary-container', 0, colorFormat, false, true),

    // Secondary colors (4)
    colorFactory(secondary, 'secondary', 0, colorFormat, false, true),
    colorFactory(onSecondary, 'on-secondary', 0, colorFormat, false, true),
    colorFactory(secondaryContainer, 'secondary-container', 0, colorFormat, false, true),
    colorFactory(onSecondaryContainer, 'on-secondary-container', 0, colorFormat, false, true),

    // Tertiary colors (4)
    colorFactory(tertiary, 'tertiary', 0, colorFormat, false, true),
    colorFactory(onTertiary, 'on-tertiary', 0, colorFormat, false, true),
    colorFactory(tertiaryContainer, 'tertiary-container', 0, colorFormat, false, true),
    colorFactory(onTertiaryContainer, 'on-tertiary-container', 0, colorFormat, false, true),

    // Surface colors (3)
    colorFactory(surfaces.surface, 'surface', 0, colorFormat, false, true),
    colorFactory(surfaces.onSurface, 'on-surface', 0, colorFormat, false, true),
    colorFactory(surfaces.onSurfaceVariant, 'on-surface-variant', 0, colorFormat, false, true),

    // Container variants (3)
    colorFactory(surfaces.container, 'container', 0, colorFormat, false, true),
    colorFactory(surfaces.containerSunken, 'container-sunken', 0, colorFormat, false, true),
    colorFactory(surfaces.containerOverlay, 'container-overlay', 0, colorFormat, false, true),

    // Outline (2)
    colorFactory(outlineInverse.outline, 'outline', 0, colorFormat, false, true),
    colorFactory(outlineInverse.outlineVariant, 'outline-variant', 0, colorFormat, false, true),

    // Inverse (2)
    colorFactory(outlineInverse.inverseSurface, 'inverse-surface', 0, colorFormat, false, true),
    colorFactory(outlineInverse.onInverseSurface, 'on-inverse-surface', 0, colorFormat, false, true),

    // Semantic colors (12)
    colorFactory(semantic.error, 'error', 0, colorFormat, false, true),
    colorFactory(semantic.onError, 'on-error', 0, colorFormat, false, true),
    colorFactory(errorContainer, 'error-container', 0, colorFormat, false, true),
    colorFactory(onErrorContainer, 'on-error-container', 0, colorFormat, false, true),
    // Text tier: the same hue at real text contrast. The solid role colours above are tuned to
    // read as their role (amber looks amber) rather than to carry body text.
    colorFactory(semantic.errorText, 'error-text', 0, colorFormat, false, true),
    colorFactory(semantic.success, 'success', 0, colorFormat, false, true),
    colorFactory(semantic.onSuccess, 'on-success', 0, colorFormat, false, true),
    colorFactory(successContainer, 'success-container', 0, colorFormat, false, true),
    colorFactory(onSuccessContainer, 'on-success-container', 0, colorFormat, false, true),
    colorFactory(semantic.successText, 'success-text', 0, colorFormat, false, true),
    colorFactory(semantic.warning, 'warning', 0, colorFormat, false, true),
    colorFactory(semantic.onWarning, 'on-warning', 0, colorFormat, false, true),
    colorFactory(warningContainer, 'warning-container', 0, colorFormat, false, true),
    colorFactory(onWarningContainer, 'on-warning-container', 0, colorFormat, false, true),
    colorFactory(semantic.warningText, 'warning-text', 0, colorFormat, false, true),

    // Interaction states + disabled + utility (Audit 4C/4D)
    colorFactory(primaryHover, 'primary-hover', 0, colorFormat, false, true),
    colorFactory(primaryPressed, 'primary-pressed', 0, colorFormat, false, true),
    colorFactory(onDisabled, 'on-disabled', 0, colorFormat, false, true),
    colorFactory(disabledContainer, 'disabled-container', 0, colorFormat, false, true),
    colorFactory(scrim, 'scrim', 0, colorFormat, false, true),
    colorFactory(shadow, 'shadow', 0, colorFormat, false, true),
  ]
}
