import Color from 'colorjs.io'
import type { BaseColorData } from './factory'

export function findOptimalLightness(
  baseColor: Color,
  background: Color,
  minRatio: number,
): Color {
  const backgroundL = background.oklch.l ?? 0.5
  const needLightForeground = backgroundL < 0.5

  let minL = 0
  let maxL = 1
  let bestColor = baseColor.clone()

  for (let i = 0; i < 20; i++) {
    const testL = (minL + maxL) / 2
    const testColor = baseColor.clone()
    testColor.oklch.l = testL

    const contrast = testColor.contrastWCAG21(background)

    if (contrast >= minRatio) {
      bestColor = testColor.clone()
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

export function getMedianChroma(palette: BaseColorData[]): number {
  const chromas = palette
    .filter((item) => item?.color?.oklch?.c !== undefined)
    .map((item) => item.color.oklch.c ?? 0)
    .sort((a, b) => a - b)
  if (chromas.length === 0) return 0.1
  const mid = Math.floor(chromas.length / 2)
  return chromas.length % 2 === 0
    ? (chromas[mid - 1] + chromas[mid]) / 2
    : chromas[mid]
}

export function findColorByHue(
  palette: BaseColorData[],
  targetHue: number,
  tolerance = 30,
): Color | null {
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
