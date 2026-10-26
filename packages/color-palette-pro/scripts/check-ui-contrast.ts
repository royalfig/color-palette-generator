/**
 * Contrast regression check for the UI token palette, in both output gamuts.
 *
 *   npx tsx scripts/check-ui-contrast.ts        (or: npm run check:ui)
 *
 * check-invariants.ts covers code mode in sRGB only. This covers the UI palette's brand roles
 * (primary / secondary / tertiary, their on-colours and on-container colours) over a seed grid,
 * once with sRGB hex output and once with OKLCH output, where those roles are realized in Rec. 2020.
 *
 * In OKLCH mode a token is seen three ways — the wide `string` on a Rec. 2020 screen, that value
 * mapped down on a P3 screen, and the sRGB `hex` fallback — and each pair is required to clear
 * 4.5:1 in ALL of them, measured on the serialized values a consumer actually receives (not the
 * float coords), so hex quantization and gamut mapping are included. The P3 form is modelled with
 * colorjs `toGamut()` (CSS Color 4 mapping); a browser that clips instead may differ slightly.
 *
 * Also prints, as information rather than a gate, how often the primary lands on the seed itself.
 * Exits non-zero if any pair falls below 4.5:1.
 */
import Color from 'colorjs.io'
import { createPalettes } from '../src/index.ts'
import { clampChromaToGamut } from '../src/ui/colorMath.ts'
import type { PaletteKinds, PaletteStyle } from '../src/types/types.ts'

const STYLES: PaletteStyle[] = ['square', 'triangle', 'circle', 'diamond']
/** Kinds feed only the accents; analogous and tints & shades are the two accent-selection extremes. */
const KINDS: PaletteKinds[] = ['ana', 'tas']
const MODES = [
  { name: 'srgb', colorSpace: { space: 'srgb', format: 'hex' }, gamut: 'srgb' },
  { name: 'oklch', colorSpace: { space: 'oklch', format: 'oklch' }, gamut: 'rec2020' },
] as const
const MIN_RATIO = 4.5

/** Named seeds that broke something before, plus an OKLCH L x C x H grid reaching far out of gamut. */
const SEEDS: string[] = [
  'oklch(56% 0.28 66.1)', '#3b82f6', '#e11d48', '#666633', '#004345', '#f5c518', '#8b5cf6', '#7d7d80',
  '#0aff9d', '#808080', '#000000', '#ffffff', '#010101', '#fefefe', 'oklch(100% 0.4 120)', 'oklch(0% 0.3 250)',
]
for (let l = 0.1; l <= 0.96; l += 0.12)
  for (const c of [0.04, 0.12, 0.22, 0.34])
    for (let h = 0; h < 360; h += 45) SEEDS.push(`oklch(${(l * 100).toFixed(1)}% ${c} ${h})`)

const PAIRS: [fg: string, bg: string][] = [
  ['primary', 'surface'],
  ['on-primary', 'primary'],
  ['secondary', 'surface'],
  ['on-secondary', 'secondary'],
  ['tertiary', 'surface'],
  ['on-tertiary', 'tertiary'],
  ['on-primary-container', 'primary-container'],
  ['on-secondary-container', 'secondary-container'],
  ['on-tertiary-container', 'tertiary-container'],
]

let failed = 0
for (const mode of MODES) {
  const worst = new Map<string, { ratio: number; tag: string }>()
  const fails = new Map<string, number>()
  // Closest the primary gets to the (gamut-clamped) seed across the two modes, per seed x style.
  const fidelity: number[] = []

  for (const seed of SEEDS) {
    const ref = clampChromaToGamut(new Color(seed).to('oklch'), mode.gamut)
    for (const style of STYLES) {
      let best = Infinity
      for (const isDarkMode of [false, true]) {
        for (const palette of KINDS) {
          const ui = createPalettes({ color: seed, palette, style, colorSpace: mode.colorSpace, isUiMode: true, isDarkMode })
          const tok = new Map(ui.map(t => [t.code, t]))
          const shipped = (code: string) => {
            const t = tok.get(code)!
            const wide = new Color(t.string)
            return { wide, p3: wide.to('p3').toGamut(), hex: new Color(t.conversions.hex.value) }
          }
          const tag = `${seed} ${palette}/${style}/${isDarkMode ? 'dark' : 'light'}`
          for (const [fg, bg] of PAIRS) {
            const f = shipped(fg)
            const b = shipped(bg)
            for (const [form, ratio] of [
              ['hex', f.hex.contrastWCAG21(b.hex)],
              ['wide', f.wide.contrastWCAG21(b.wide)],
              ...(mode.gamut === 'rec2020' ? [['p3', f.p3.contrastWCAG21(b.p3)] as const] : []),
            ] as const) {
              const key = `${fg} (${form})`
              if (ratio < (worst.get(key)?.ratio ?? Infinity)) worst.set(key, { ratio, tag })
              if (ratio < MIN_RATIO) fails.set(key, (fails.get(key) ?? 0) + 1)
            }
          }
          best = Math.min(best, ref.deltaEOK(shipped('primary').wide) * 100)
        }
      }
      fidelity.push(best)
    }
  }

  console.log(`\n${mode.name} (${mode.gamut}) — ${SEEDS.length} seeds x ${STYLES.length} styles x ${KINDS.length} kinds x 2 modes`)
  for (const [key, w] of worst) {
    const n = fails.get(key) ?? 0
    failed += n
    const flag = n ? `  FAIL x${n}` : ''
    console.log(`  ${key.padEnd(30)} min ${w.ratio.toFixed(2)}  (${w.tag})${flag}`)
  }
  fidelity.sort((a, b) => a - b)
  const exact = fidelity.filter(d => d < 0.5).length
  console.log(`  primary on seed (dE < 0.5):  ${exact}/${fidelity.length}   median dE ${fidelity[fidelity.length >> 1].toFixed(2)}`)
}

if (failed) {
  console.log(`\nFAIL — ${failed} pairs below ${MIN_RATIO}:1.`)
  process.exit(1)
}
console.log(`\nPASS — every brand-role pair clears ${MIN_RATIO}:1 in every gamut and every rendered form.`)
