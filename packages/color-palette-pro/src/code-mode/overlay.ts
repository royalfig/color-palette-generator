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
 * For a translucent overlay (e.g. selectionBackground), find the smallest alpha at which
 * the composited overlay-on-bg still meets minLc APCA against the syntax foreground.
 * If startAlpha already passes, return it unchanged.
 */
export function legibleOverlayAlpha(
  overlayHex: string,
  bgHex: string,
  fgHex: string,
  startAlpha: number,
  minLc: number,
  maxAlpha = 0.85,
): number {
  let alpha = startAlpha
  for (let i = 0; i < 8; i++) {
    const composited = compositeOver(overlayHex, bgHex, alpha)
    if (Math.abs(composited.contrastAPCA(new Color(fgHex))) >= minLc) return alpha
    if (alpha >= maxAlpha) return maxAlpha
    alpha = Math.min(maxAlpha, alpha + (maxAlpha - alpha) * 0.4)
  }
  return alpha
}
