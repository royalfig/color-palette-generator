import Color from 'colorjs.io'

/**
 * Composite a foreground color over a background using straight alpha blending.
 * Used to check the *effective* color of a translucent overlay.
 */
function compositeOver(fgHex: string, bgHex: string, alpha: number): Color {
  const fg = new Color(fgHex).to('srgb')
  const bg = new Color(bgHex).to('srgb')
  if (!fg || !bg) return new Color(fgHex)
  const r = (fg.coords[0] ?? 0) * alpha + (bg.coords[0] ?? 0) * (1 - alpha)
  const g = (fg.coords[1] ?? 0) * alpha + (bg.coords[1] ?? 0) * (1 - alpha)
  const b = (fg.coords[2] ?? 0) * alpha + (bg.coords[2] ?? 0) * (1 - alpha)
  return new Color('srgb', [r, g, b])
}

/**
 * For a translucent overlay (e.g. selectionBackground), find the LARGEST alpha at or below
 * startAlpha at which every token that can sit on it stays legible.
 *
 * The previous version searched in the wrong direction and against the wrong reference: it only
 * ever *raised* alpha (so a too-strong default could never be corrected), and it measured against
 * editorForeground — the highest-contrast token in the theme, and therefore the one least at risk.
 * With a 0.70 dark default that left the median dark theme with every syntax role below Lc 45
 * inside a selection, and most below Lc 15: selecting text made it unreadable.
 *
 * "Legible" is defined per token as `min(minLc, its own Lc on the bare background × RETENTION)`,
 * not as a flat floor. A flat floor is unsatisfiable: comments are deliberately recessed below
 * Lc 45, so demanding 45 of every token drives alpha to ~0.02 and the selection disappears
 * entirely. What a selection must not do is *degrade* the text much below what it already was.
 *
 * Alpha 0 composites to the bare background, so a solution always exists.
 */
const RETENTION = 0.85

export function legibleOverlayAlpha(
  overlayHex: string,
  bgHex: string,
  tokenHexes: string[],
  startAlpha: number,
  minLc: number,
): number {
  const bg = new Color(bgHex)
  const requirement = tokenHexes.map(t => {
    const onBg = Math.abs(bg.contrastAPCA(new Color(t)))
    return Math.min(minLc, onBg * RETENTION)
  })
  const passes = (alpha: number): boolean => {
    const composited = compositeOver(overlayHex, bgHex, alpha)
    for (let i = 0; i < tokenHexes.length; i++) {
      if (Math.abs(composited.contrastAPCA(new Color(tokenHexes[i]))) < requirement[i]) return false
    }
    return true
  }
  if (passes(startAlpha)) return startAlpha
  let lo = 0
  let hi = startAlpha
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2
    if (passes(mid)) lo = mid
    else hi = mid
  }
  return lo
}

/**
 * Smallest alpha at which `fgHex` drawn over `bgHex` reaches `targetLc` APCA against that same
 * background — i.e. how opaque a hairline, guide or gutter mark has to be to actually be visible.
 *
 * Fixed alphas cannot do this job: the same alpha buys roughly 45-55% as much contrast over a dark
 * ground as over a light one, which is why the hardcoded 0.08 guides and rulers measured Lc 0.0 in
 * every dark theme while reading correctly in light.
 */
export function alphaForContrastOnBg(
  fgHex: string,
  bgHex: string,
  targetLc: number,
  maxAlpha = 1,
): number {
  const bg = new Color(bgHex)
  const lcAt = (alpha: number): number =>
    Math.abs(compositeOver(fgHex, bgHex, alpha).contrastAPCA(bg))
  if (lcAt(maxAlpha) < targetLc) return maxAlpha
  let lo = 0
  let hi = maxAlpha
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2
    if (lcAt(mid) >= targetLc) hi = mid
    else lo = mid
  }
  return hi
}
