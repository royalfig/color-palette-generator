import Color from 'colorjs.io'
import { ColorFormat, PaletteStyle } from '../types/types'
import { colorToCss, REL_WRAP, surfaceTreatmentFor } from './uiUtils'

export function generateElevationShadowVars(
  primary: Color,
  isDarkMode: boolean,
  format: ColorFormat = 'oklch',
  style: PaletteStyle = 'square',
): Record<string, string> {
  const { shadowProfile } = surfaceTreatmentFor(style)
  const hsl = primary.to('hsl')
  const isAchromatic = (primary.oklch.c ?? 0) < 0.01
  const hue = Number.isFinite(hsl.coords[0] ?? NaN) ? (hsl.coords[0] as number) : 0

  // Near-neutral ink: faint hue, low saturation. Darker in light mode (crisp, not hazy).
  // A near-black shadow (L 5 in dark) has essentially no contrast against a dark surface — the
  // brutalist hard tiers measured 1.05-1.49:1 against the diamond dark stack, i.e. invisible,
  // while reading 6-8:1 in light. Physics, not tuning: nothing darker than an L 0.12 surface is
  // available. A hard-edged block in dark mode therefore has to be LIGHTER than the surface it
  // lifts off, the way a letterpress deboss reads as a highlight rather than a shadow.
  const hardInDark = isDarkMode && shadowProfile === 'hard'
  const shadowCol = hardInDark
    ? new Color('hsl', [hue, isAchromatic ? 0 : 10, 82])
    : new Color('hsl', [hue, isAchromatic ? 0 : isDarkMode ? 6 : 4, isDarkMode ? 5 : 30])
  // Key-light edge: lighter than the surface (white-ish in light, a lifted brand tone in dark).
  const highlightCol = new Color('hsl', [hue, isAchromatic ? 0 : isDarkMode ? 14 : 12, isDarkMode ? 62 : 100])

  const rel = REL_WRAP[format] ?? REL_WRAP.oklch
  const ink = (alpha: number) =>
    `${rel.fn}(from var(--shadow-color) ${rel.channels} / calc(${alpha} * var(--shadow-strength)))`
  const lit = (alpha: number) =>
    `${rel.fn}(from var(--highlight-color) ${rel.channels} / calc(${alpha} * var(--shadow-strength)))`

  // One drop-shadow layer, its offset rotated from --light-angle (0deg ⇒ straight down).
  const layer = (d: number, blur: number, spread: number, alpha: number) =>
    `calc(sin(var(--light-angle)) * ${(-d).toFixed(2)}px) calc(cos(var(--light-angle)) * ${d.toFixed(2)}px) ${blur}px ${spread}px ${ink(alpha)}`
  const topHighlight = (alpha: number) => `inset 0 1px 0 ${lit(alpha)}`
  const join = (layers: string[]) => layers.join(',\n    ')

  // [offset-distance, blur, spread, alpha] per layer. Dark tiers are deliberately shallow and
  // lean on the highlight; light tiers layer more, with darker low-alpha ink for a crisp edge.
  const softTiers = isDarkMode
    ? {
        xs: [layer(0.5, 1, 0, 0.4)],
        low: [topHighlight(0.35), layer(1, 2, -0.5, 0.5)],
        medium: [topHighlight(0.4), layer(2, 4, -1, 0.5), layer(6, 9, -2, 0.5)],
        high: [topHighlight(0.45), layer(4, 7, -1, 0.45), layer(12, 18, -2, 0.45), layer(26, 34, -3, 0.45)],
      }
    : {
        xs: [layer(0.5, 0.8, 0, 0.1)],
        low: [topHighlight(0.5), layer(0.5, 0.6, 0, 0.12), layer(1, 1.3, -0.6, 0.12), layer(2.3, 2.7, -1.3, 0.12)],
        medium: [
          topHighlight(0.5),
          layer(0.5, 0.6, 0, 0.12),
          layer(1.8, 2.1, -0.5, 0.12),
          layer(4.5, 5.2, -1, 0.12),
          layer(9, 10.5, -1.6, 0.12),
        ],
        high: [
          topHighlight(0.5),
          layer(0.5, 0.6, 0, 0.11),
          layer(3, 3.5, -0.3, 0.11),
          layer(6, 6.8, -0.6, 0.11),
          layer(10.5, 12, -1, 0.11),
          layer(17, 19, -1.4, 0.11),
          layer(26, 29, -1.9, 0.11),
        ],
      }

  // Hard (brutalist) tiers: one crisp offset block per level — no penumbra, no top highlight,
  // higher alpha — so elevation reads as a hard-edged drop rather than a soft glow.
  // Distances are scaled by sqrt(2) because a 315deg offset splits the distance across two axes;
  // this keeps the visible step at 1/2/4/7px per axis, matching the soft ladder's rhythm.
  const D = Math.SQRT2
  const hardTiers = {
    xs: [layer(1 * D, 0, 0, isDarkMode ? 0.6 : 0.5)],
    low: [layer(2 * D, 0, 0, isDarkMode ? 0.7 : 0.55)],
    medium: [layer(4 * D, 0, 0, isDarkMode ? 0.85 : 0.65)],
    high: [layer(7 * D, 0, 0, isDarkMode ? 1 : 0.8)],
  }

  const tiers = shadowProfile === 'hard' ? hardTiers : softTiers

  return {
    // Soft elevation is lit from directly above (a straight-down offset reads as ambient depth).
    // The hard/brutalist profile wants a diagonal block instead — 315deg puts the offset down and
    // to the right, which is the direction the whole idiom depends on.
    '--light-angle': shadowProfile === 'hard' ? '315deg' : '0deg',
    '--shadow-strength': '1',
    '--shadow-color': colorToCss(shadowCol, format),
    '--highlight-color': colorToCss(highlightCol, format),
    '--shadow-elevation-xs': join(tiers.xs),
    '--shadow-elevation-low': join(tiers.low),
    '--shadow-elevation-medium': join(tiers.medium),
    '--shadow-elevation-high': join(tiers.high),
  }
}
