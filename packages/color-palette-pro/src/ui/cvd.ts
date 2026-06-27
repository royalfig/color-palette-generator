import Color from 'colorjs.io'

/**
 * Color-vision-deficiency (CVD) simulation.
 *
 * Uses the widely-cited Brettel/Viénot-derived single-plane approximation matrices for the
 * three dichromacies, applied to gamma-encoded sRGB. These are approximations — good enough
 * to answer "would these two colors collapse onto each other for a dichromat?", which is what
 * we use them for (distinctness checks), not for pixel-accurate clinical simulation.
 */
export type CvdType = 'protanopia' | 'deuteranopia' | 'tritanopia'

const MATRICES: Record<CvdType, number[][]> = {
  // Protanopia (no L-cones): reds darken and collapse toward green/yellow.
  protanopia: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],
  // Deuteranopia (no M-cones): the most common CVD; red/green confusion.
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  // Tritanopia (no S-cones): blue/yellow confusion (rare).
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.433, 0.567],
    [0.0, 0.475, 0.525],
  ],
}

/** Simulate how `color` appears to a viewer with the given dichromacy. */
export function simulateCvd(color: Color, type: CvdType): Color {
  const srgb = color.to('srgb').toGamut({ space: 'srgb' })
  const [r, g, b] = srgb.coords.map(v => Math.max(0, Math.min(1, v ?? 0)))
  const m = MATRICES[type]
  const nr = m[0][0] * r + m[0][1] * g + m[0][2] * b
  const ng = m[1][0] * r + m[1][1] * g + m[1][2] * b
  const nb = m[2][0] * r + m[2][1] * g + m[2][2] * b
  return new Color('srgb', [Math.max(0, Math.min(1, nr)), Math.max(0, Math.min(1, ng)), Math.max(0, Math.min(1, nb))])
}

/**
 * Perceptual distance (OKLab ΔE, scaled ×100 to match `code-mode/utils.deltaE`) between two
 * colors *as a given dichromat would see them*. Returns the minimum across the common
 * red-green dichromacies — the worst case for status-color confusion.
 */
export function cvdDistance(a: Color, b: Color, types: CvdType[] = ['deuteranopia', 'protanopia']): number {
  let min = Infinity
  for (const type of types) {
    const sa = simulateCvd(a, type).to('oklab')
    const sb = simulateCvd(b, type).to('oklab')
    const dL = ((sa.coords[0] ?? 0) - (sb.coords[0] ?? 0)) * 100
    const da = ((sa.coords[1] ?? 0) - (sb.coords[1] ?? 0)) * 100
    const db = ((sa.coords[2] ?? 0) - (sb.coords[2] ?? 0)) * 100
    min = Math.min(min, Math.sqrt(dL * dL + da * da + db * db))
  }
  return min
}
