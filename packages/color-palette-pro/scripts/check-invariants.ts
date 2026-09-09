/**
 * Invariant regression check for the palette + theme pipeline.
 *
 *   npx tsx scripts/check-invariants.ts        (or: npm run check)
 *
 * Every defect found in the 2026 palette-logic audit would have been caught by one of the
 * assertions below, which is the point: the generator produces thousands of themes and no human
 * looks at more than a handful, so the guarantees have to be machine-checked.
 *
 * Exits non-zero if any invariant regresses. Thresholds are deliberately set at the level the
 * pipeline currently ACHIEVES (with a little slack), not at an aspiration — a check that is
 * already failing teaches everyone to ignore it.
 */
import Color from 'colorjs.io'
import { createPalettes, generateCodeTheme, generateTheme } from '../src/index.ts'
import { cvdDistance } from '../src/ui/cvd.ts'
import type { PaletteKinds, PaletteStyle } from '../src/types/types.ts'

const KINDS: PaletteKinds[] = ['ana', 'com', 'spl', 'tri', 'tet', 'tas']
const STYLES: PaletteStyle[] = ['square', 'triangle', 'circle', 'diamond']
const SPACE = { space: 'srgb', format: 'hex' } as const
const SEEDS = ['#3b82f6', '#e11d48', '#666633', '#004345', '#f5c518', '#8b5cf6', '#7d7d80', '#0aff9d']
/** Seeds that historically broke the math: achromatic, pure black/white, out-of-gamut neon. */
const DEGENERATE = ['#808080', '#000000', '#ffffff', '#7d7d80', '#0aff9d', '#010101', '#fefefe']

const LOUD = ['keyword', 'string', 'type', 'number', 'definition', 'regex', 'accent'] as const

// ---------- helpers ----------
const apca = (bg: string, fg: string): number => Math.abs(new Color(bg).contrastAPCA(new Color(fg)))
const dE = (a: string, b: string): number => new Color(a).deltaEOK(new Color(b)) * 100
const hueOf = (hex: string): number => new Color(hex).to('oklch').oklch.h ?? 0
const hueGap = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180)

// Mono kinds have ONE hue: seven loud roles can only be separated by lightness and saturation
// inside a ~0.18-wide readable band, so they get their own (lower) floor. This is a property of
// monochrome design, not a defect — real monochrome themes lean on font style for the rest.
const MONO_KINDS: PaletteKinds[] = ['tas']

function tokensOf(theme: any): Record<string, string> {
  const want: Record<string, string> = {
    keyword: 'keyword',
    string: 'string',
    type: 'entity.name.type',
    number: 'constant.numeric',
    definition: 'entity.name.function',
    regex: 'string.regexp',
    accent: 'variable.language',
    variable: 'variable',
    comment: 'comment',
    punctuation: 'punctuation.separator',
  }
  const out: Record<string, string> = {}
  for (const [role, scope] of Object.entries(want)) {
    const hit = (theme.tokenColors ?? []).find((tc: any) =>
      (Array.isArray(tc.scope) ? tc.scope : [tc.scope]).some((s: string) => s === scope),
    )
    if (hit?.settings?.foreground) out[role] = hit.settings.foreground
  }
  return out
}

// ---------- the checks ----------
interface Failure {
  check: string
  detail: string
}
const failures: Failure[] = []
const record = (check: string, ok: boolean, detail: string): void => {
  if (!ok) failures.push({ check, detail })
}

const stat = { min: Infinity, worst: '' }
const note = (v: number, label: string): void => {
  if (v < stat.min) {
    stat.min = v
    stat.worst = label
  }
}

console.log('Generating themes...')
const themes: { seed: string; kind: PaletteKinds; style: PaletteStyle; dark: boolean; theme: any }[] = []
for (const seed of SEEDS)
  for (const kind of KINDS)
    for (const style of STYLES)
      for (const dark of [true, false]) {
        const palette = createPalettes({ color: seed, palette: kind, style, colorSpace: SPACE })
        themes.push({
          seed,
          kind,
          style,
          dark,
          theme: generateCodeTheme({ baseColor: seed, palette, isDarkMode: dark, paletteKind: kind, paletteStyle: style }),
        })
      }
console.log(`  ${themes.length} themes\n`)

// 1. No two loud syntax roles may be the same colour, and they must stay separable.
{
  let identical = 0
  let minChromatic = Infinity
  let worstChromatic = ''
  let minMono = Infinity
  let worstMono = ''
  for (const { seed, kind, style, dark, theme } of themes) {
    const t = tokensOf(theme)
    const hexes = LOUD.map(r => t[r]).filter(Boolean)
    if (new Set(hexes).size < hexes.length) identical++
    const mono = MONO_KINDS.includes(kind)
    for (let i = 0; i < hexes.length; i++)
      for (let j = i + 1; j < hexes.length; j++) {
        const d = dE(hexes[i], hexes[j])
        const label = `${seed}/${kind}/${style}/${dark ? 'dark' : 'light'}`
        if (mono && d < minMono) {
          minMono = d
          worstMono = label
        }
        if (!mono && d < minChromatic) {
          minChromatic = d
          worstChromatic = label
        }
      }
  }
  record('loud roles never identical', identical === 0, `${identical} themes ship two loud roles at the same hex`)
  record('chromatic kinds separable (dE >= 1.8)', minChromatic >= 1.8, `min pairwise dE ${minChromatic.toFixed(2)} at ${worstChromatic}`)
  record('mono kinds separable (dE >= 0.9)', minMono >= 0.9, `min pairwise dE ${minMono.toFixed(2)} at ${worstMono}`)
  console.log(
    `  loud-role separation: ${identical} identical, min dE ${minChromatic.toFixed(2)} chromatic / ${minMono.toFixed(2)} mono`,
  )
}

// 2. Loud roles must stay separable for a dichromat, not only in normal vision. Uses the
// library's OWN CVD model (ui/cvd.ts) so the check and the pipeline agree on what "distinct"
// means. Threshold is well below the normal-vision one on purpose: demanding full separation
// under simulation would collapse every theme into a pure lightness ladder.
{
  let minD = Infinity
  let worst = ''
  for (const { seed, kind, style, dark, theme } of themes) {
    const t = tokensOf(theme)
    const cols = LOUD.map(r => t[r]).filter(Boolean).map(h => new Color(h))
    for (let i = 0; i < cols.length; i++)
      for (let j = i + 1; j < cols.length; j++) {
        const d = cvdDistance(cols[i], cols[j])
        if (d < minD) {
          minD = d
          worst = `${seed}/${kind}/${style}/${dark ? 'dark' : 'light'}`
        }
      }
  }
  record('loud roles separable under CVD (>= 0.5)', minD >= 0.5, `min CVD distance ${minD.toFixed(2)} at ${worst}`)
  console.log(`  CVD separation:       min distance ${minD.toFixed(2)} (${worst})`)
}

// 3. Contrast floors. Loud syntax must clear the mode's target; comments must stay in their band.
{
  let minLoud = Infinity
  let worstLoud = ''
  let commentOut = 0
  for (const { seed, kind, style, dark, theme } of themes) {
    const t = tokensOf(theme)
    const bg = theme.colors['editor.background']
    for (const r of LOUD) {
      if (!t[r]) continue
      const lc = apca(bg, t[r])
      if (lc < minLoud) {
        minLoud = lc
        worstLoud = `${r} ${seed}/${kind}/${style}/${dark ? 'dark' : 'light'}`
      }
    }
    if (t.comment) {
      const lc = apca(bg, t.comment)
      if (lc < 25 || lc > 60) commentOut++
    }
  }
  record('loud syntax >= Lc 40', minLoud >= 40, `min loud Lc ${minLoud.toFixed(1)} at ${worstLoud}`)
  record('comments inside their band', commentOut === 0, `${commentOut} themes have comments outside Lc 25-60`)
  console.log(`  contrast:             min loud Lc ${minLoud.toFixed(1)}, ${commentOut} comments out of band`)
}

// 4. Text stays readable inside a selection (the composite, not the raw colour).
{
  let minLc = Infinity
  let worst = ''
  for (const { seed, kind, style, dark, theme } of themes) {
    const bg = theme.colors['editor.background']
    const sel = theme.colors['editor.selectionBackground']
    if (!sel) continue
    const a = parseInt(sel.slice(7, 9) || 'ff', 16) / 255
    const f = new Color(sel.slice(0, 7)).to('srgb')
    const b = new Color(bg).to('srgb')
    const over = new Color('srgb', [0, 1, 2].map(i => (f.coords[i] ?? 0) * a + (b.coords[i] ?? 0) * (1 - a)) as [
      number,
      number,
      number,
    ])
    for (const hex of Object.values(tokensOf(theme))) {
      const lc = Math.abs(over.contrastAPCA(new Color(hex)))
      if (lc < minLc) {
        minLc = lc
        worst = `${seed}/${kind}/${style}/${dark ? 'dark' : 'light'}`
      }
    }
  }
  record('text readable on selection (Lc >= 20)', minLc >= 20, `min Lc on selection ${minLc.toFixed(1)} at ${worst}`)
  console.log(`  selection:            worst token Lc ${minLc.toFixed(1)}`)
}

// 5. Hairline chrome must be visible in BOTH modes (fixed alphas used to vanish in dark).
{
  let minLc = Infinity
  let worst = ''
  for (const { seed, kind, style, dark, theme } of themes) {
    const bg = theme.colors['editor.background']
    for (const key of ['editorIndentGuide.background', 'editorWhitespace.foreground', 'editorRuler.foreground']) {
      const v = theme.colors[key]
      if (!v) continue
      const a = parseInt(v.slice(7, 9) || 'ff', 16) / 255
      const f = new Color(v.slice(0, 7)).to('srgb')
      const b = new Color(bg).to('srgb')
      const over = new Color('srgb', [0, 1, 2].map(i => (f.coords[i] ?? 0) * a + (b.coords[i] ?? 0) * (1 - a)) as [
        number,
        number,
        number,
      ])
      const lc = Math.abs(over.contrastAPCA(new Color(bg)))
      if (lc < minLc) {
        minLc = lc
        worst = `${key} ${seed}/${kind}/${style}/${dark ? 'dark' : 'light'}`
      }
    }
  }
  record('guides visible (Lc >= 8)', minLc >= 8, `min guide Lc ${minLc.toFixed(1)} at ${worst}`)
  console.log(`  guides/whitespace:    min Lc ${minLc.toFixed(1)}`)
}

// 6. STYLE IS MATERIAL ONLY: a token's hue must not change between styles.
{
  let maxDrift = 0
  let worst = ''
  for (const seed of SEEDS)
    for (const kind of KINDS)
      for (const dark of [true, false]) {
        const perStyle = STYLES.map(style => tokensOf(themes.find(t => t.seed === seed && t.kind === kind && t.style === style && t.dark === dark)!.theme))
        for (const role of [...LOUD, 'variable', 'comment'] as string[]) {
          const hues = perStyle.map(p => p[role]).filter(Boolean).map(hueOf)
          if (hues.length < 2) continue
          for (let i = 1; i < hues.length; i++) {
            const d = hueGap(hues[0], hues[i])
            if (d > maxDrift) {
              maxDrift = d
              worst = `${role} ${seed}/${kind}/${dark ? 'dark' : 'light'}`
            }
          }
        }
      }
  // The gamut mapper moves hue by a mean 3.2 degrees with a tail to ~12, so some drift is
  // inherent. What must never happen is a role landing on a different colour family.
  record('style does not change hue (< 30 deg)', maxDrift < 30, `max drift ${maxDrift.toFixed(1)} deg at ${worst}`)
  console.log(`  style hue invariance: max drift ${maxDrift.toFixed(1)} deg (${worst})`)
}

// 7. Surface ladder: the sunken tier must actually be distinguishable from the editor.
{
  let minLc = Infinity
  let worst = ''
  for (const { seed, kind, style, dark, theme } of themes) {
    const bg = theme.colors['editor.background']
    const sunk = theme.colors['input.background'] ?? theme.colors['sideBar.background']
    if (!sunk) continue
    // Measured in deltaE, not APCA: APCA is a text-on-background model and clamps low-contrast
    // pairs to 0, so two clearly different dark surfaces both report Lc 0.
    const d = dE(bg, sunk)
    if (d < minLc) {
      minLc = d
      worst = `${seed}/${kind}/${style}/${dark ? 'dark' : 'light'}`
    }
  }
  record('sunken tier distinguishable (dE >= 3)', minLc >= 3, `min dE ${minLc.toFixed(2)} at ${worst}`)
  console.log(`  surface ladder:       sunken vs editor min dE ${minLc.toFixed(2)}`)
}

// 8. Determinism: identical inputs must produce byte-identical output.
{
  let mismatches = 0
  for (const seed of SEEDS.slice(0, 3))
    for (const kind of KINDS)
      for (const format of ['vscode', 'zed'] as const) {
        const p1 = createPalettes({ color: seed, palette: kind, style: 'square', colorSpace: SPACE })
        const p2 = createPalettes({ color: seed, palette: kind, style: 'square', colorSpace: SPACE })
        const a = generateTheme({ baseColor: seed, palette: p1, isDarkMode: true, paletteKind: kind, format })
        const b = generateTheme({ baseColor: seed, palette: p2, isDarkMode: true, paletteKind: kind, format })
        if (a !== b) mismatches++
      }
  record('deterministic', mismatches === 0, `${mismatches} non-deterministic outputs`)
  console.log(`  determinism:          ${mismatches} mismatches`)
}

// 9. Degenerate seeds must not produce NaN, invalid hex, or a throw, in any format.
{
  const bad: string[] = []
  for (const seed of DEGENERATE)
    for (const kind of KINDS)
      for (const style of STYLES)
        for (const dark of [true, false])
          for (const format of ['vscode', 'zed', 'ghostty', 'iterm2', 'warp', 'alacritty'] as const) {
            try {
              const palette = createPalettes({ color: seed, palette: kind, style, colorSpace: SPACE })
              const out = generateTheme({ baseColor: seed, palette, isDarkMode: dark, paletteKind: kind, paletteStyle: style, format })
              // Only inspect COLOUR values. Scanning the whole document false-positives on
              // legitimate scope names like `constant.language.undefined`.
              // {3,} so a bare '#' (ghostty/alacritty comment marker) is not read as a colour.
              for (const raw of out.match(/#[0-9a-zA-Z]{3,}/g) ?? []) {
                if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) {
                  bad.push(`${seed}/${kind}/${style}/${format}: bad colour ${raw}`)
                }
              }
              if (/NaN/.test(out)) bad.push(`${seed}/${kind}/${style}/${format}: NaN in output`)
            } catch (e) {
              bad.push(`${seed}/${kind}/${style}/${format}: threw ${(e as Error).message}`)
            }
          }
  record('degenerate seeds safe', bad.length === 0, bad.slice(0, 5).join('; '))
  console.log(`  degenerate seeds:     ${bad.length} problems`)
}

// ---------- report ----------
console.log()
if (failures.length === 0) {
  console.log(`PASS — all invariants hold across ${themes.length} themes.`)
  process.exit(0)
}
console.log(`FAIL — ${failures.length} invariant(s) regressed:\n`)
for (const f of failures) console.log(`  x ${f.check}\n      ${f.detail}`)
process.exit(1)
