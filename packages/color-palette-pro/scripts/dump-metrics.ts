/**
 * Machine-readable dump of everything the library produces, plus derived metrics.
 * Written for the palette-logic evaluation swarm.
 *
 *   npx tsx scripts/dump-metrics.ts [outDir]
 *
 * Writes <outDir>/dump.json : one record per seed x kind x style x mode, containing
 *   ui[]       — the UI token palette (code, hex, oklch)
 *   code{}     — the VS Code theme `colors` map (workbench chrome)
 *   tokens{}   — resolved syntax token colors by role
 *   metrics{}  — APCA / dE / hue-spread / chroma statistics
 * and <outDir>/summary.csv : one row per combination with the headline metrics.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Color from 'colorjs.io'
import { createPalettes, generateCodeTheme } from '../src/index.ts'
import type { PaletteKinds, PaletteStyle } from '../src/types/types.ts'

const KINDS: PaletteKinds[] = ['ana', 'com', 'spl', 'tri', 'tet', 'tas']
const STYLES: PaletteStyle[] = ['square', 'triangle', 'circle', 'diamond']
const SPACE = { space: 'srgb', format: 'hex' } as const

/** A spread of seeds: warm, cool, muted, neon, near-gray, dark, light. */
const SEEDS = [
  '#3b82f6', // canonical blue
  '#e11d48', // hot rose
  '#666633', // muddy olive
  '#004345', // deep teal
  '#f5c518', // bright gold
  '#8b5cf6', // violet
  '#7d7d80', // near-gray
  '#0aff9d', // neon mint
]

// ---------- perceptual helpers ----------
function apca(fg: string, bg: string): number {
  return Math.abs(new Color(bg).contrastAPCA(new Color(fg)))
}
function wcag(fg: string, bg: string): number {
  return new Color(fg).contrastWCAG21(new Color(bg))
}
function dE(a: string, b: string): number {
  return new Color(a).deltaEOK(new Color(b)) * 100
}
function ok(hex: string) {
  const c = new Color(hex).to('oklch')
  return {
    l: +(c.oklch.l ?? 0).toFixed(4),
    c: +(c.oklch.c ?? 0).toFixed(4),
    h: +(c.oklch.h ?? 0).toFixed(1),
  }
}
function hueSpread(hues: number[]): number {
  if (hues.length < 2) return 0
  const s = [...hues].sort((a, b) => a - b)
  let maxGap = 360 - s[s.length - 1] + s[0]
  for (let i = 1; i < s.length; i++) maxGap = Math.max(maxGap, s[i] - s[i - 1])
  return 360 - maxGap
}
/** Crude deuteranope/protanope/tritanope simulation (Brettel-style matrices on linear RGB). */
const CVD_MATRICES: Record<string, number[][]> = {
  protan: [
    [0.1121, 0.8853, -0.0005],
    [0.1127, 0.8897, -0.0001],
    [0.0045, 0.0, 1.0019],
  ],
  deutan: [
    [0.292, 0.7054, -0.0003],
    [0.2934, 0.7089, 0.0004],
    [-0.0209, 0.0257, 0.9971],
  ],
  tritan: [
    [1.0175, 0.0273, -0.0453],
    [-0.011, 0.9587, 0.0523],
    [0.0038, 0.0937, 0.9025],
  ],
}
function simulateCvd(hex: string, kind: keyof typeof CVD_MATRICES): string {
  const m = CVD_MATRICES[kind]
  const [r, g, b] = new Color(hex).to('srgb-linear').coords
  const out = m.map(row => row[0] * r + row[1] * g + row[2] * b)
  return new Color('srgb-linear', out as [number, number, number]).to('srgb').toString({ format: 'hex' })
}

// ---------- the syntax roles we care about ----------
const LOUD_ROLES = ['keyword', 'string', 'type', 'number', 'definition', 'regex', 'accent'] as const
const QUIET_ROLES = ['variable', 'property', 'operator', 'punctuation', 'comment'] as const

/** Pull a representative color per role out of the VS Code tokenColors array. */
function resolveTokens(theme: any): Record<string, string> {
  const scopeFor: Record<string, string[]> = {
    keyword: ['keyword'],
    string: ['string'],
    type: ['entity.name.type'],
    number: ['constant.numeric'],
    definition: ['entity.name.function'],
    regex: ['string.regexp'],
    accent: ['variable.language'],
    variable: ['variable'],
    property: ['variable.other.property'],
    operator: ['keyword.operator'],
    punctuation: ['punctuation.separator'],
    comment: ['comment'],
  }
  const out: Record<string, string> = {}
  // Match only an EXACT scope string. Prefix/substring matching mis-resolves, because e.g. the
  // comment entry legitimately lists "string.quoted.docstring.multi" and
  // "punctuation.definition.comment".
  for (const [role, wanted] of Object.entries(scopeFor)) {
    for (const w of wanted) {
      const hit = (theme.tokenColors ?? []).find((tc: any) => {
        const scopes = Array.isArray(tc.scope) ? tc.scope : [tc.scope]
        return scopes.some((sc: string) => sc === w)
      })
      if (hit?.settings?.foreground) {
        out[role] = hit.settings.foreground
        break
      }
    }
  }
  return out
}

// ---------- main ----------
const outDir = resolve(process.argv[2] ?? 'scripts/dump')
mkdirSync(outDir, { recursive: true })

type Record_ = Record<string, unknown>
const records: Record_[] = []

for (const seed of SEEDS) {
  for (const kind of KINDS) {
    for (const style of STYLES) {
      for (const isDarkMode of [true, false]) {
        const ui = createPalettes({
          color: seed,
          palette: kind,
          style,
          colorSpace: SPACE,
          isUiMode: true,
          isDarkMode,
        }).map(s => ({ code: s.code, hex: s.conversions.hex.value, oklch: ok(s.conversions.hex.value) }))

        const raw = createPalettes({ color: seed, palette: kind, style, colorSpace: SPACE }).map(s => ({
          code: s.code,
          hex: s.conversions.hex.value,
          oklch: ok(s.conversions.hex.value),
        }))

        const theme: any = generateCodeTheme({
          baseColor: seed,
          palette: createPalettes({ color: seed, palette: kind, style, colorSpace: SPACE }),
          isDarkMode,
          paletteKind: kind,
          paletteStyle: style,
        })
        const colors: Record<string, string> = theme.colors ?? {}
        const tokens = resolveTokens(theme)

        const bg = colors['editor.background']
        const loud = LOUD_ROLES.map(r => tokens[r]).filter(Boolean)
        const quiet = QUIET_ROLES.map(r => tokens[r]).filter(Boolean)
        const all = [...loud, ...quiet]

        // pairwise dE among loud tokens (confusability)
        let minPairDe = Infinity
        let minPair = ''
        for (let i = 0; i < loud.length; i++) {
          for (let j = i + 1; j < loud.length; j++) {
            const d = dE(loud[i], loud[j])
            if (d < minPairDe) {
              minPairDe = d
              minPair = `${LOUD_ROLES[i]}/${LOUD_ROLES[j]}`
            }
          }
        }
        // same, under each CVD sim
        const cvdMin: Record<string, number> = {}
        for (const sim of Object.keys(CVD_MATRICES)) {
          let m = Infinity
          for (let i = 0; i < loud.length; i++)
            for (let j = i + 1; j < loud.length; j++)
              m = Math.min(m, dE(simulateCvd(loud[i], sim as any), simulateCvd(loud[j], sim as any)))
          cvdMin[sim] = +m.toFixed(2)
        }

        const loudOk = loud.map(ok)
        const chromas = loudOk.map(o => o.c)
        const lights = loudOk.map(o => o.l)

        // does each loud token track a palette swatch hue?
        const paletteHues = raw.filter(s => s.oklch.c > 0.03).map(s => s.oklch.h)
        const hueDrift = loudOk.map(o => {
          if (!paletteHues.length) return 0
          return Math.min(...paletteHues.map(ph => Math.min(Math.abs(o.h - ph), 360 - Math.abs(o.h - ph))))
        })

        const surfaceLadder = [
          'editor.background',
          'sideBar.background',
          'panel.background',
          'statusBar.background',
          'titleBar.activeBackground',
          'editorWidget.background',
          'input.background',
        ].map(k => ({ key: k, hex: colors[k], oklch: colors[k] ? ok(colors[k]) : null }))

        records.push({
          seed,
          kind,
          style,
          mode: isDarkMode ? 'dark' : 'light',
          raw,
          ui,
          tokens: Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, { hex: v, oklch: ok(v) }])),
          chrome: Object.fromEntries(
            Object.entries(colors)
              .filter(([, v]) => typeof v === 'string' && /^#[0-9a-f]{6,8}$/i.test(v))
              .map(([k, v]) => [k, v]),
          ),
          metrics: {
            editorBg: { hex: bg, oklch: ok(bg) },
            surfaceLadder,
            /** APCA Lc of each token on the editor background. */
            apca: Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, +apca(v, bg).toFixed(1)])),
            wcagFg: +wcag(colors['editor.foreground'], bg).toFixed(2),
            loud: {
              lMin: +Math.min(...lights).toFixed(3),
              lMax: +Math.max(...lights).toFixed(3),
              lSpread: +(Math.max(...lights) - Math.min(...lights)).toFixed(3),
              cMin: +Math.min(...chromas).toFixed(3),
              cMax: +Math.max(...chromas).toFixed(3),
              cSpread: +(Math.max(...chromas) - Math.min(...chromas)).toFixed(3),
              hueSpread: +hueSpread(loudOk.map(o => o.h)).toFixed(1),
              maxHueDriftFromPalette: +Math.max(...hueDrift).toFixed(1),
            },
            minPairwiseDeltaE: +minPairDe.toFixed(2),
            minPairwiseDeltaEPair: minPair,
            cvdMinDeltaE: cvdMin,
            paletteHueSpread: +hueSpread(paletteHues).toFixed(1),
            allTokenCount: all.length,
          },
        })
      }
    }
  }
}

writeFileSync(resolve(outDir, 'dump.json'), JSON.stringify(records, null, 2))

const header = [
  'seed',
  'kind',
  'style',
  'mode',
  'editorBg',
  'bgL',
  'bgC',
  'fgWCAG',
  'apcaComment',
  'apcaKeyword',
  'apcaString',
  'apcaMin',
  'loudLSpread',
  'loudCMin',
  'loudCMax',
  'loudHueSpread',
  'maxHueDrift',
  'minDeltaE',
  'minDeltaEPair',
  'cvdDeutanMinDeltaE',
  'paletteHueSpread',
]
const rows = records.map((r: any) => {
  const m = r.metrics
  const apcaVals = Object.values(m.apca) as number[]
  return [
    r.seed,
    r.kind,
    r.style,
    r.mode,
    m.editorBg.hex,
    m.editorBg.oklch.l,
    m.editorBg.oklch.c,
    m.wcagFg,
    m.apca.comment,
    m.apca.keyword,
    m.apca.string,
    Math.min(...apcaVals),
    m.loud.lSpread,
    m.loud.cMin,
    m.loud.cMax,
    m.loud.hueSpread,
    m.loud.maxHueDriftFromPalette,
    m.minPairwiseDeltaE,
    m.minPairwiseDeltaEPair,
    m.cvdMinDeltaE.deutan,
    m.paletteHueSpread,
  ].join(',')
})
writeFileSync(resolve(outDir, 'summary.csv'), [header.join(','), ...rows].join('\n'))

console.log(`wrote ${records.length} records to ${outDir}`)
