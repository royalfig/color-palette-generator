import Color from 'colorjs.io'

export function detectFormat(str: string): 'hex' | undefined {
  if (str.startsWith('#')) return 'hex'

  // Add more as needed
  return undefined
}

const OKLCH_LIMITS = {
  l: { min: 0.01, max: 0.99 }, // Avoid pure black/white
  c: { min: 0, max: 0.37 }, // Conservative chroma limit
  h: { min: 0, max: 360 }, // Hue wraps naturally
}

export function clampOKLCH(l: number, c: number, h: number) {
  return {
    l: Math.max(OKLCH_LIMITS.l.min, Math.min(OKLCH_LIMITS.l.max, l)),
    c: Math.max(OKLCH_LIMITS.c.min, Math.min(OKLCH_LIMITS.c.max, c)),
    h: ((h % 360) + 360) % 360, // Wrap hue properly
  }
}

export function getRandBetween() {
  return Math.floor(Math.random() * 100) + 1
}

export function hex3to6(color: Color) {
  const hex = color.toString({ format: 'hex' }).substring(1)

  if (hex.length === 3) {
    const [a, b, c] = hex
    return a + a + b + b + c + c
  }

  return hex
}

export function linearRGB(num: number) {
  if (num > 0.03928) {
    return num + 0.055
  }

  return num / 12.92
}

export function y(num: Color) {
  let { r, g, b } = num.srgb

  // r /= 255;
  // g /= 255;
  // b / 255;

  const rL = linearRGB(r)
  const gL = linearRGB(g)
  const bL = linearRGB(b)

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL
}

export function createSlug(str: string) {
  return str.split(' ')[0].toLowerCase().replace(/\W/, '-')
}

export function isLight(color: Color) {
  const l = color.oklch.l

  if (l >= 0.5) {
    return true
  }

  return false
}
