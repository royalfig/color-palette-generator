import Color from 'colorjs.io'
import type { BaseColorData } from '../factory'

// ===== GAMUT-AWARE CHROMA =====
// Real sRGB-realizable OKLCH chroma is a strong function of *both* lightness and hue
// (~0.13 for blue, ~0.32 for yellow; collapsing toward ~0.02 at the L extremes). A single
// constant ceiling either fails to protect low-chroma hues or needlessly caps high ones, so
// distinct swatches collapse onto the gamut boundary at output. These helpers compute the
// true per-(L,H) limit and reduce chroma while holding L and H exactly.

/**
 * Largest in-gamut OKLCH chroma for a given lightness + hue, via binary search.
 * Returns 0 for an achromatic (NaN-hue) request.
 */
export function maxChromaFor(l: number, h: number, space: string = 'srgb'): number {
  if (!Number.isFinite(h) || !Number.isFinite(l)) return 0
  const probe = new Color('oklch', [l, 0, h])
  if (!probe.inGamut(space as any)) return 0 // L itself out of gamut (≈ pure black/white)
  let lo = 0
  let hi = 0.4 // safely above the sRGB OKLCH chroma maximum (~0.322 for yellow)
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    probe.oklch.c = mid
    if (probe.inGamut(space as any)) lo = mid
    else hi = mid
  }
  return lo
}

/**
 * Reduce a color's chroma until it sits inside the target gamut, holding L and H constant
 * (perceptually the least-destructive gamut mapping — no hue shift, no lightness shift).
 * In-gamut colors are returned unchanged.
 */
export function clampChromaToGamut(color: Color, space: string = 'srgb'): Color {
  if (color.inGamut(space as any)) return color.clone()
  const o = color.to('oklch')
  const l = o.coords[0] ?? 0
  const c = o.coords[1] ?? 0
  const h = o.coords[2]
  const result = color.clone()
  result.oklch.c = Math.min(c, maxChromaFor(l, h as number, space))
  return result
}

export function findOptimalLightness(baseColor: Color, background: Color, minRatio: number): Color {
  const backgroundL = background.oklch.l ?? 0.5
  const needLightForeground = backgroundL < 0.5

  let minL = 0
  let maxL = 1
  let bestColor = clampChromaToGamut(baseColor)

  for (let i = 0; i < 20; i++) {
    const testL = (minL + maxL) / 2
    const testColor = baseColor.clone()
    testColor.oklch.l = testL
    // Measure contrast on the *realizable* color: pushing L while holding a high chroma can
    // leave the gamut, and WCAG luminance computed from out-of-gamut coords is not the value
    // that will actually render — so reduce chroma to gamut before measuring.
    const realized = clampChromaToGamut(testColor)

    const contrast = realized.contrastWCAG21(background)

    if (contrast >= minRatio) {
      bestColor = realized.clone()
      if (needLightForeground) {
        maxL = testL
      } else {
        minL = testL
      }
    } else {
      if (needLightForeground) {
        minL = testL
      } else {
        maxL = testL
      }
    }

    if (Math.abs(maxL - minL) < 0.0001) break
  }

  return bestColor
}

/**
 * Median chroma of the *colored* palette members. Near-neutral swatches are excluded so the
 * result reflects the palette's typical saturation rather than being dragged toward 0 by greys.
 * Used only as a rough fallback for semantic chroma. (Audit 5.3.)
 */
export function getMedianChroma(palette: BaseColorData[]): number {
  const chromas = palette
    .map(item => item?.color?.oklch?.c ?? 0)
    .filter(c => Number.isFinite(c) && c > 0.02)
    .sort((a, b) => a - b)
  if (chromas.length === 0) return 0.1
  const mid = Math.floor(chromas.length / 2)
  return chromas.length % 2 === 0 ? (chromas[mid - 1] + chromas[mid]) / 2 : chromas[mid]
}

export function findColorByHue(palette: BaseColorData[], targetHue: number, tolerance = 30): Color | null {
  let bestMatch: Color | null = null
  let bestDistance = Infinity

  for (const item of palette) {
    if (item?.color?.oklch?.h !== undefined) {
      const hue = item.color.oklch.h ?? 0
      const diff = Math.abs(hue - targetHue)
      const distance = Math.min(diff, 360 - diff)
      if (distance <= tolerance && distance < bestDistance) {
        bestDistance = distance
        bestMatch = item.color.clone()
      }
    }
  }
  return bestMatch
}
