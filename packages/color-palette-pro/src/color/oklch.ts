import Color from 'colorjs.io'

// Shared, framework-agnostic OKLCH/format primitives. These defer to colorjs.io for the actual
// color math (interpolation, ΔE, gamut mapping) wherever colorjs provides it — the palette, ui,
// and code-mode layers all build on these instead of each maintaining a private copy.

/**
 * Convert a Color to an uppercase hex string, gamut-mapped to sRGB and including an alpha byte
 * when the color is translucent (#RRGGBBAA). Theme files want stable, uppercase, full-length hex.
 */
export function toHex(color: Color): string {
  const srgb = color.to('srgb')
  if (!srgb) return '#000000'
  const gamut = srgb.toGamut()
  const r = clamp255(Math.round((gamut.coords[0] ?? 0) * 255))
  const g = clamp255(Math.round((gamut.coords[1] ?? 0) * 255))
  const b = clamp255(Math.round((gamut.coords[2] ?? 0) * 255))
  const a = color.alpha !== undefined ? Math.round(color.alpha * 255) : 255

  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  if (a < 255) {
    return (hex + clamp255(a).toString(16).padStart(2, '0')).toUpperCase()
  }
  return hex.toUpperCase()
}

function clamp255(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(255, v))
}

/** Returns a clone of the color with the given alpha. Accepts a Color or any parseable string. */
export function withAlpha(color: Color | string, alpha: number): Color {
  const c = new Color(color).clone()
  c.alpha = alpha
  return c
}

/**
 * Interpolate two colors in OKLCH. Defers to colorjs's `mix()` (shortest-hue-path LCH
 * interpolation) instead of a hand-rolled lerp.
 */
export function mix(a: Color, b: Color, ratio: number): Color {
  return a.mix(b, ratio, { space: 'oklch', outputSpace: 'oklch' }) as Color
}

/**
 * Perceptual distance in OKLab (colorjs `deltaEOK`), measured *after* sRGB gamut mapping so two
 * distinct OKLCH values that collapse to the same rendered hex read as close. Scaled ×100 to keep
 * the same magnitude the pipeline thresholds were tuned against.
 */
export function deltaE(a: Color, b: Color): number {
  const ca = a.clone().to('srgb').toGamut()
  const cb = b.clone().to('srgb').toGamut()
  return ca.deltaEOK(cb) * 100
}

/** Smallest unsigned angle between two hues, in degrees (0–180). */
export function hueGapDeg(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Shift hue by degrees while preserving chroma and lightness. */
export function shiftHue(color: Color, degrees: number): Color {
  const c = color.clone()
  c.oklch.h = ((c.oklch.h ?? 0) + degrees + 360) % 360
  return c
}

/** Reduce chroma toward neutral by `factor` (0 = unchanged, 1 = fully desaturated). */
export function desaturate(color: Color, factor: number): Color {
  const c = color.clone()
  c.oklch.c = Math.max((c.oklch.c ?? 0) * (1 - factor), 0)
  return c
}

/** Multiply chroma by `factor`, capped at 0.25 to stay in a usable range. */
export function boostChroma(color: Color, factor: number): Color {
  const c = color.clone()
  c.oklch.c = Math.min((c.oklch.c ?? 0) * factor, 0.25)
  return c
}
