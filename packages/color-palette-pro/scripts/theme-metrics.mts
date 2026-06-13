/**
 * Theme metrics harness — measures the OKLCH "shape" of a theme so generated
 * output can be compared against the exemplar themes numerically.
 *
 * Metrics per theme:
 *   - loud-role L band (min / max / spread)         exemplar dark ≈ 0.65–0.90, spread ≤ 0.17
 *   - loud-role chroma band (min / max / spread)    internally consistent per theme
 *   - min pairwise OKLCH hue distance (loud roles)  ≥ ~25° in polychrome themes
 *   - comment APCA Lc vs editor bg                  exemplars ≈ 38–55
 *   - editor bg chroma + hue                        Nord ≈ 0.016, Night Owl ≈ 0.04
 *
 * Usage:
 *   npx tsx scripts/theme-metrics.mts                          # exemplars only
 *   npx tsx scripts/theme-metrics.mts generated-themes/ff001a  # + generated themes
 */

import Color from 'colorjs.io'
import * as fs from 'fs'
import * as path from 'path'
import {
  EXEMPLARS,
  LOUD_EXEMPLAR_ROLES,
  QUIET_EXEMPLAR_ROLES,
  type ExemplarRole,
} from './exemplar-themes.mts'

interface ThemeShape {
  name: string
  mode: 'dark' | 'light'
  bg: string
  fg: string
  roles: Partial<Record<ExemplarRole, string>>
}

interface Metrics {
  name: string
  mode: string
  loudL: { min: number; max: number; spread: number }
  loudC: { min: number; max: number; spread: number }
  minHueGap: number
  commentLc: number | null
  quietCMax: number
  bgC: number
  bgL: number
}

function oklch(hex: string): { l: number; c: number; h: number } {
  const c = new Color(hex).to('oklch')
  return { l: c.coords[0] ?? 0, c: c.coords[1] ?? 0, h: Number.isNaN(c.coords[2]) ? 0 : (c.coords[2] ?? 0) }
}

function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function measure(theme: ThemeShape): Metrics {
  const loud = LOUD_EXEMPLAR_ROLES.map((r) => theme.roles[r]).filter((v): v is string => !!v).map(oklch)
  const quiet = QUIET_EXEMPLAR_ROLES.map((r) => theme.roles[r]).filter((v): v is string => !!v).map(oklch)

  const ls = loud.map((c) => c.l)
  const cs = loud.map((c) => c.c)

  // Only count hue gaps between roles chromatic enough for hue to read (C > 0.03).
  const hued = loud.filter((c) => c.c > 0.03)
  let minHueGap = 360
  for (let i = 0; i < hued.length; i++) {
    for (let j = i + 1; j < hued.length; j++) {
      minHueGap = Math.min(minHueGap, hueGap(hued[i].h, hued[j].h))
    }
  }

  const commentHex = theme.roles.comment
  const commentLc = commentHex
    ? Math.abs(new Color(commentHex).contrastAPCA(new Color(theme.bg)))
    : null

  const bg = oklch(theme.bg)

  return {
    name: theme.name,
    mode: theme.mode,
    loudL: { min: Math.min(...ls), max: Math.max(...ls), spread: Math.max(...ls) - Math.min(...ls) },
    loudC: { min: Math.min(...cs), max: Math.max(...cs), spread: Math.max(...cs) - Math.min(...cs) },
    minHueGap: hued.length > 1 ? minHueGap : 0,
    commentLc,
    quietCMax: quiet.length ? Math.max(...quiet.map((c) => c.c)) : 0,
    bgC: bg.c,
    bgL: bg.l,
  }
}

// ----- generated-theme adapter (VS Code JSON → ThemeShape) -----

const SEMANTIC_ROLE_KEYS: Record<ExemplarRole, string> = {
  keyword: 'keyword',
  function: 'function',
  string: 'string',
  number: 'number',
  type: 'type',
  comment: 'comment',
  variable: 'variable',
  operator: 'operator',
}

function fromVSCodeJson(filePath: string): ThemeShape | null {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (!json.colors || !json.semanticTokenColors) return null
  const roles: Partial<Record<ExemplarRole, string>> = {}
  for (const [role, key] of Object.entries(SEMANTIC_ROLE_KEYS) as [ExemplarRole, string][]) {
    const v = json.semanticTokenColors[key]
    const hex = typeof v === 'string' ? v : v?.foreground
    if (hex) roles[role] = hex
  }
  return {
    name: path.basename(filePath, '.json'),
    mode: json.type === 'light' ? 'light' : 'dark',
    bg: json.colors['editor.background'],
    fg: json.colors['editor.foreground'],
    roles,
  }
}

// ----- reporting -----

const f = (n: number, d = 3): string => n.toFixed(d)

function row(m: Metrics): string {
  return [
    m.name.padEnd(36),
    m.mode.padEnd(6),
    `L ${f(m.loudL.min, 2)}–${f(m.loudL.max, 2)} (Δ${f(m.loudL.spread, 2)})`.padEnd(22),
    `C ${f(m.loudC.min)}–${f(m.loudC.max)} (Δ${f(m.loudC.spread)})`.padEnd(28),
    `hueGap ${f(m.minHueGap, 0).padStart(3)}°`.padEnd(13),
    `cmtLc ${m.commentLc === null ? ' n/a' : f(m.commentLc, 0).padStart(4)}`.padEnd(11),
    `qC ${f(m.quietCMax)}`.padEnd(10),
    `bg L${f(m.bgL, 2)} C${f(m.bgC)}`,
  ].join(' ')
}

function summarize(label: string, all: Metrics[]): void {
  if (!all.length) return
  console.log()
  console.log(`── ${label} ${'─'.repeat(Math.max(0, 120 - label.length))}`)
  for (const m of all) console.log(row(m))
  const dark = all.filter((m) => m.mode === 'dark')
  if (dark.length > 1) {
    const agg = (sel: (m: Metrics) => number): string => {
      const vs = dark.map(sel)
      return `${f(Math.min(...vs))}–${f(Math.max(...vs))}`
    }
    console.log()
    console.log(`   dark aggregate → loud L spread ${agg((m) => m.loudL.spread)} | loud C spread ${agg((m) => m.loudC.spread)} | comment Lc ${agg((m) => m.commentLc ?? 0)} | bg C ${agg((m) => m.bgC)}`)
  }
}

const args = process.argv.slice(2)

summarize('Exemplars', EXEMPLARS.map(measure))

for (const arg of args) {
  const full = path.resolve(arg)
  const files = fs.statSync(full).isDirectory()
    ? fs.readdirSync(full).filter((f) => f.endsWith('.json')).map((f) => path.join(full, f)).sort()
    : [full]
  const metrics: Metrics[] = []
  for (const file of files) {
    const shape = fromVSCodeJson(file)
    if (shape) metrics.push(measure(shape))
  }
  summarize(arg, metrics)
}
