/**
 * Color-logic verification harness. Run: `pnpm verify` (from the package dir).
 *
 * Exercises every palette generator and the UI/code token builders across a matrix of seed
 * colors (incl. achromatic + high-chroma extremes) × kinds × styles, and reports invariant
 * violations. This is a regression net for the audit fixes in COLOR_AUDIT_TODO.md — it prints
 * a summary and exits non-zero if any hard invariant fails.
 */
import Color from 'colorjs.io'
import { createPalettes } from '../src/index'
import { generateTheme } from '../src/code-mode'
import { cvdDistance } from '../src/cvd'
import type { PaletteKinds, PaletteStyle } from '../src/types'

const SEEDS: { name: string; hex: string }[] = [
  { name: 'mid-blue', hex: '#3b6ea5' },
  { name: 'vivid-red', hex: '#e01b24' },
  { name: 'vivid-yellow', hex: '#f6d32d' },
  { name: 'vivid-green', hex: '#2ec27e' },
  { name: 'deep-purple', hex: '#613583' },
  { name: 'orange', hex: '#e66100' },
  { name: 'teal', hex: '#0f8888' },
  { name: 'near-black', hex: '#111111' },
  { name: 'near-white', hex: '#fafafa' },
  { name: 'pure-gray', hex: '#888888' },
]

const KINDS: PaletteKinds[] = ['ana', 'tri', 'tet', 'com', 'spl', 'tas']
const STYLES: PaletteStyle[] = ['square', 'triangle', 'circle', 'diamond']
const SPACE = { space: 'oklch', format: 'hex' } as const

type Counters = Record<string, number>
const violations: Counters = {}
const examples: Record<string, string> = {}
function flag(kind: string, detail: string) {
  violations[kind] = (violations[kind] ?? 0) + 1
  if (!examples[kind]) examples[kind] = detail
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function checkColorInGamut(c: Color, ctx: string) {
  // Pre-output gamut: the generator's intended color should be realizable in sRGB.
  if (!c.inGamut('srgb')) {
    const oklch = c.to('oklch')
    flag('out-of-gamut', `${ctx} c=${(oklch.coords[1] ?? 0).toFixed(3)} L=${(oklch.coords[0] ?? 0).toFixed(2)} h=${(oklch.coords[2] ?? 0).toFixed(0)}`)
  }
  const o = c.to('oklch')
  if (!isFiniteNum(o.coords[0]) || !isFiniteNum(o.coords[1])) {
    flag('nan-coord', `${ctx} L/C NaN`)
  }
  // A NaN hue is legitimate for a truly achromatic color; only flag if chroma is meaningful.
  if ((o.coords[1] ?? 0) > 0.01 && !isFiniteNum(o.coords[2])) {
    flag('nan-hue-with-chroma', `${ctx} h NaN at c=${(o.coords[1] ?? 0).toFixed(3)}`)
  }
}

// ---- palette generators ----
for (const seed of SEEDS) {
  for (const kind of KINDS) {
    for (const style of STYLES) {
      let palette
      try {
        palette = createPalettes(seed.hex, kind, style, SPACE)
      } catch (e) {
        flag('threw', `${seed.name}/${kind}/${style}: ${e}`)
        continue
      }
      for (const item of palette) {
        checkColorInGamut(item.color, `${seed.name}/${kind}/${style}/${item.code}`)
      }
    }
  }
}

// ---- UI token set ----
function tokenMap(tokens: ReturnType<typeof createPalettes>) {
  const m: Record<string, Color> = {}
  for (const t of tokens) m[t.code] = t.color
  return m
}

for (const seed of SEEDS) {
  for (const dark of [false, true]) {
    for (const kind of KINDS) {
      let tokens
      try {
        tokens = createPalettes(seed.hex, kind, 'square', SPACE, [0, 0, 0, 0], true, dark)
      } catch (e) {
        flag('ui-threw', `${seed.name}/${kind}/${dark}: ${e}`)
        continue
      }
      const m = tokenMap(tokens)
      const mode = dark ? 'dark' : 'light'
      const ctx = `${seed.name}/${kind}/${mode}`

      for (const t of tokens) checkColorInGamut(t.color, `ui:${ctx}/${t.code}`)

      // Contrast pairs that must hold (foreground vs the background it sits on).
      const pairs: [string, string, number][] = [
        ['on-primary', 'primary', 4.5],
        ['on-secondary', 'secondary', 4.5],
        ['on-tertiary', 'tertiary', 4.5],
        ['on-surface', 'surface', 7.0],
        ['on-surface-variant', 'surface', 4.5],
        ['on-primary-container', 'primary-container', 4.5],
        ['on-error-container', 'error-container', 4.5],
        ['on-success-container', 'success-container', 4.5],
        ['on-warning-container', 'warning-container', 4.5],
        ['on-error', 'error', 4.5],
        ['outline', 'surface', 3.0],
      ]
      for (const [fg, bg, min] of pairs) {
        if (!m[fg] || !m[bg]) continue
        const ratio = m[fg].contrastWCAG21(m[bg])
        if (ratio < min - 0.05) flag(`contrast<${min}`, `ui:${ctx} ${fg}/${bg} = ${ratio.toFixed(2)}`)
      }

      // Semantic colors should remain mutually distinct for red-green dichromats.
      const sem: [string, string][] = [
        ['error', 'success'],
        ['error', 'warning'],
        ['warning', 'success'],
      ]
      for (const [a, b] of sem) {
        if (!m[a] || !m[b]) continue
        const d = cvdDistance(m[a], m[b])
        if (d < 12) flag('cvd-collision', `ui:${ctx} ${a}/${b} ΔE_cvd=${d.toFixed(1)}`)
      }
    }
  }
}

// ---- code-mode (smoke: must not throw, must emit parseable output) ----
for (const seed of SEEDS) {
  for (const kind of [...KINDS, 'ton'] as PaletteKinds[]) {
    for (const dark of [false, true]) {
      try {
        const base = new Color(seed.hex)
        const palette = kind === 'ton'
          ? createPalettes(seed.hex, 'tas', 'square', SPACE)
          : createPalettes(seed.hex, kind, 'square', SPACE)
        const out = generateTheme(base, palette, dark, kind, 'square', 'vscode')
        JSON.parse(out)
      } catch (e) {
        flag('code-mode-threw', `${seed.name}/${kind}/${dark}: ${e}`)
      }
    }
  }
}

// ---- report ----
const keys = Object.keys(violations).sort()
console.log('\n=== color-logic verification ===')
if (keys.length === 0) {
  console.log('✓ all invariants passed')
  process.exit(0)
}
let hard = 0
for (const k of keys) {
  console.log(`  ${k}: ${violations[k]}   e.g. ${examples[k]}`)
  hard += violations[k]
}
console.log(`\n${hard} violation(s) across ${keys.length} categor(ies).`)
process.exit(1)
