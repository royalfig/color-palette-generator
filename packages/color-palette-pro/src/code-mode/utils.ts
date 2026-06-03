import Color from 'colorjs.io'
import { BaseColorData } from './types'
import { findOptimalLightness, findColorByHue, getMedianChroma } from '../color-math'

export { findColorByHue }

/**
 * Generates an accessible (4.5:1) version of a color on a given background.
 */
export function getAccessibleVariant(
  color: Color,
  background: Color,
  minRatio: number = 4.5,
): string {
  const target = color.clone()
  target.oklch.c = Math.max(target.oklch.c ?? 0, 0.06)
  
  const isDarkBg = (background.oklch.l ?? 0.5) < 0.5
  target.oklch.l = isDarkBg ? 0.9 : 0.12

  if (target.contrastWCAG21(background) >= minRatio) {
    return toHex(target)
  }

  target.oklch.l = isDarkBg ? 0.98 : 0.02
  if (target.contrastWCAG21(background) >= minRatio) {
    return toHex(target)
  }

  const best = findOptimalLightness(target, background, minRatio)
  return toHex(best)
}

/**
 * Ensure a color has sufficient contrast against a background.
 */
export function ensureContrast(
  color: Color,
  background: Color,
  minRatio: number,
): string {
  if (color.contrastWCAG21(background) >= minRatio) {
    return toHex(color)
  }
  return getAccessibleVariant(color, background, minRatio)
}

/**
 * Desaturate a color while preserving its hue and lightness.
 */
export function desaturate(color: Color, factor: number): Color {
  const c = color.clone()
  c.oklch.c = Math.max((c.oklch.c ?? 0) * (1 - factor), 0)
  return c
}

/**
 * Shift hue by degrees while preserving chroma and lightness.
 */
export function shiftHue(color: Color, degrees: number): Color {
  const c = color.clone()
  c.oklch.h = ((c.oklch.h ?? 0) + degrees + 360) % 360
  return c
}

/**
 * Boost chroma of a color.
 */
export function boostChroma(color: Color, factor: number): Color {
  const c = color.clone()
  c.oklch.c = Math.min((c.oklch.c ?? 0) * factor, 0.25)
  return c
}

/**
 * Convert a Color to hex string, including alpha channel if present.
 */
export function toHex(color: Color): string {
  const srgb = color.to('srgb')
  if (!srgb) return '#000000'
  const gamut = srgb.toGamut()
  const r = Math.round((gamut.coords[0] ?? 0) * 255)
  const g = Math.round((gamut.coords[1] ?? 0) * 255)
  const b = Math.round((gamut.coords[2] ?? 0) * 255)
  const a = color.alpha !== undefined ? Math.round(color.alpha * 255) : 255

  const hex = `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`
  if (a < 255) {
    return (hex + clamp(a).toString(16).padStart(2, '0')).toUpperCase()
  }
  return hex.toUpperCase()
}

/**
 * Returns a new color with the specified alpha value.
 */
export function withAlpha(color: Color | string, alpha: number): Color {
  const c = new Color(color).clone()
  c.alpha = alpha
  return c
}

function clamp(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(255, v))
}

/**
 * Clamp/adapt OKLCH lightness (L) for AAA text legibility while preserving hue and chroma.
 * Legibility ranges: 0.75-0.90 for dark mode, 0.20-0.45 for light mode.
 */
export function adaptLightnessForText(color: Color, isDarkMode: boolean): Color {
  const c = color.clone()
  if (isDarkMode) {
    c.oklch.l = Math.max(0.75, Math.min(0.90, c.oklch.l ?? 0.5))
  } else {
    c.oklch.l = Math.max(0.20, Math.min(0.45, c.oklch.l ?? 0.5))
  }
  return c
}

/**
 * Adapt a "quiet" role: keeps L in a tighter, less prominent band than primary syntax.
 * Used for variables, properties, operators, punctuation — high-frequency tokens that
 * shouldn't compete with definitions/keywords/strings.
 */
export function adaptLightnessForQuiet(color: Color, isDarkMode: boolean): Color {
  const c = color.clone()
  if (isDarkMode) {
    c.oklch.l = Math.max(0.62, Math.min(0.82, c.oklch.l ?? 0.5))
  } else {
    c.oklch.l = Math.max(0.30, Math.min(0.55, c.oklch.l ?? 0.5))
  }
  return c
}

/**
 * Tint a neutral color toward a hue. Used to derive quiet roles (variable, property)
 * from onSurfaceVariant so they carry a whiff of palette identity without competing.
 */
export function tintTowardHue(neutral: Color, towardHue: number, hueAmount = 1.0, chromaAdd = 0.012): Color {
  const c = neutral.clone()
  c.oklch.h = towardHue
  c.oklch.c = Math.min(0.06, (c.oklch.c ?? 0) + chromaAdd * Math.max(0, Math.min(1, hueAmount)))
  return c
}

/**
 * Binary-search for the L value that minimally satisfies an APCA contrast target.
 * APCA returns Lc (positive = light fg on dark bg, negative = dark fg on light bg).
 * We compare |Lc| against minLc.
 *
 * APCA targets (Bronze readability):
 *  - 75: body text
 *  - 60: fluent text / large body
 *  - 45: incidental UI text
 *  - 30: spot text / decorative
 */
function findOptimalLightnessAPCA(color: Color, background: Color, minLc: number): Color {
  const bgL = background.oklch.l ?? 0.5
  const needLightForeground = bgL < 0.5

  let minL = 0
  let maxL = 1
  let bestColor = color.clone()
  let bestLc = Math.abs(color.contrastAPCA(background))

  for (let i = 0; i < 22; i++) {
    const testL = (minL + maxL) / 2
    const test = color.clone()
    test.oklch.l = testL
    const lc = Math.abs(test.contrastAPCA(background))

    if (lc >= minLc) {
      bestColor = test.clone()
      bestLc = lc
      if (needLightForeground) maxL = testL
      else minL = testL
    } else {
      if (needLightForeground) minL = testL
      else maxL = testL
    }
    if (Math.abs(maxL - minL) < 0.0001) break
  }
  // If we never reached the target, return the best we found (closest to target).
  return bestLc >= minLc ? bestColor : (() => {
    // fall back: push to gamut extremes
    const fb = color.clone()
    fb.oklch.l = needLightForeground ? 0.98 : 0.02
    return fb
  })()
}

/**
 * Like ensureContrastAgainst, but using APCA (perception-aligned). Returns the
 * original color if it already meets the target Lc.
 */
export function ensureAPCAAgainst(color: Color, bg: Color, minLc: number): Color {
  if (Math.abs(color.contrastAPCA(bg)) >= minLc) return color.clone()
  return findOptimalLightnessAPCA(color, bg, minLc)
}

/**
 * ΔE in OKLab space (Euclidean on L, a, b), measured *after* sRGB gamut mapping
 * so we catch cases where two distinct OKLCH colors collapse to the same hex.
 */
export function deltaE(a: Color, b: Color): number {
  const ca = (() => { const c = a.clone().to('srgb'); return c?.toGamut()?.to('oklab') ?? a.clone(); })()
  const cb = (() => { const c = b.clone().to('srgb'); return c?.toGamut()?.to('oklab') ?? b.clone(); })()
  const caCoords = ca.coords ?? [0, 0, 0]
  const cbCoords = cb.coords ?? [0, 0, 0]
  const dL = ((caCoords[0] ?? 0) - (cbCoords[0] ?? 0)) * 100
  const da = ((caCoords[1] ?? 0) - (cbCoords[1] ?? 0)) * 100
  const db = ((caCoords[2] ?? 0) - (cbCoords[2] ?? 0)) * 100
  return Math.sqrt(dL * dL + da * da + db * db)
}

/**
 * Nudge a color along the hue circle and slightly in chroma to separate it
 * from a too-close neighbor. Used when ΔE between roles is too small.
 */
export function nudgeForDistinction(color: Color, awayFrom: Color, isDarkMode: boolean): Color {
  const c = color.clone()
  const ch = c.oklch.h ?? 0
  const ah = awayFrom.oklch.h ?? 0
  let diff = ((ch - ah + 540) % 360) - 180
  const direction = diff >= 0 ? 1 : -1
  c.oklch.h = (ch + direction * 18 + 360) % 360
  c.oklch.c = Math.min(0.22, (c.oklch.c ?? 0) + 0.02)
  c.oklch.l = Math.max(isDarkMode ? 0.65 : 0.20, Math.min(isDarkMode ? 0.92 : 0.55, c.oklch.l ?? 0.5))
  return c
}

/**
 * Brighten (dark mode) or dim (light mode) an ANSI color for its bright variant.
 * Mirrors the formula used in deriveUiColors so terminal outputs stay consistent.
 */
export function brightAnsiHex(hex: string, isDarkMode: boolean, isBlack = false): string {
  const c = new Color(hex)
  c.oklch.l = Math.min(0.95, (c.oklch.l ?? 0.5) + (isDarkMode ? (isBlack ? 0.20 : 0.10) : -0.05))
  return toHex(c)
}

/**
 * Mathematical OKLCH interpolation between two colors with a ratio.
 */
export function mixColors(colorA: Color, colorB: Color, ratio: number): Color {
  const cA = colorA.clone()
  const cB = colorB.clone()
  
  const l = (cA.oklch.l ?? 0.5) * (1 - ratio) + (cB.oklch.l ?? 0.5) * ratio
  const c = (cA.oklch.c ?? 0) * (1 - ratio) + (cB.oklch.c ?? 0) * ratio
  
  // Interpolating hue requires taking the shortest path around the 360-degree circle
  let hA = cA.oklch.h ?? 0
  let hB = cB.oklch.h ?? 0
  let diff = hB - hA
  
  // Normalize difference to [-180, 180]
  if (diff > 180) {
    hB -= 360
  } else if (diff < -180) {
    hB += 360
  }
  
  const h = (hA * (1 - ratio) + hB * ratio + 360) % 360
  
  const result = cA.clone()
  result.oklch.l = l
  result.oklch.c = c
  result.oklch.h = h
  
  return result
}

