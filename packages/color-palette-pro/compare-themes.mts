/**
 * Generate dark.html and light.html — side-by-side token comparisons.
 *
 * Each page has two sections:
 *   • Code Mode — our syntax tokens vs VS Code, Dracula, Monokai, Nord (dark)
 *                                   vs VS Code, GitHub Light, Solarized Light (light)
 *   • UI Mode   — our semantic tokens vs Material Design 3 (fixed seed #6750A4)
 *
 * Usage:
 *   npx tsx compare-themes.mts [seed] [kind] [style]
 *
 * Defaults: seed=#7c3aed  kind=ana  style=diamond
 *
 * Output: generated-themes/compare/dark.html  and  light.html
 */

import Color from 'colorjs.io'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createPalettes, pickRandomColor } from './src/index'
import { buildThemeData } from './src/code-mode'
import type { SemanticColors, ThemeData } from './src/code-mode/types'
import type { PaletteKinds, PaletteStyle } from './src/types'
import { REFERENCE_CODE_THEMES } from './src/reference/code-themes'
import { MD3_SEED, MD3_LIGHT, MD3_DARK } from './src/reference/md3-tokens'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Args ────────────────────────────────────────────────────────────────────

const seedArg  = process.argv[2] ?? '#7c3aed'
const kindArg  = (process.argv[3] ?? 'ana') as PaletteKinds
const styleArg = (process.argv[4] ?? 'diamond') as PaletteStyle

const seed = seedArg.startsWith('#') ? seedArg : `#${seedArg}`
const baseColor = new Color(seed)

const palette = createPalettes(seed, kindArg, styleArg,
  { space: 'oklch', format: 'oklch' }, [0, 0, 0, 0], false, true)

const darkData  = buildThemeData(baseColor, palette, true,  kindArg, styleArg)
const lightData = buildThemeData(baseColor, palette, false, kindArg, styleArg)

// ── Helpers ──────────────────────────────────────────────────────────────────

function lum(hex: string): number {
  const r = parseInt(hex.slice(1,3), 16) / 255
  const g = parseInt(hex.slice(3,5), 16) / 255
  const b = parseInt(hex.slice(5,7), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function textOn(hex: string): string {
  return lum(hex.slice(0, 7)) > 0.35 ? '#000000' : '#FFFFFF'
}

// Strip any alpha suffix so CSS is always valid
function bare(hex: string): string { return hex.slice(0, 7) }

function deriveOn(hex: string, isDark: boolean): string {
  // "on" a primary/accent: near-white in dark, near-black in light
  return isDark ? '#FFFBFE' : '#1C1B1F'
}

// ── Token extractors ─────────────────────────────────────────────────────────

interface CodeRow {
  label: string
  sep?: boolean
  key?: keyof CodeTokenMap
}

interface CodeTokenMap {
  editorBackground: string
  editorForeground: string
  sidebarBackground: string
  comment: string
  keyword: string
  string: string
  definition: string
  type: string
  number: string
  variable: string
  operator: string
  accent: string
  regex: string
}

function extractCodeTokens(c: SemanticColors): CodeTokenMap {
  return {
    editorBackground: bare(c.editorBackground.hex),
    editorForeground: bare(c.editorForeground.hex),
    sidebarBackground: bare(c.sidebarBackground.hex),
    comment:    bare(c.commentColor.hex),
    keyword:    bare(c.keywordColor.hex),
    string:     bare(c.stringColor.hex),
    definition: bare(c.definitionColor.hex),
    type:       bare(c.typeColor.hex),
    number:     bare(c.numberColor.hex),
    variable:   bare(c.variableColor.hex),
    operator:   bare(c.operatorColor.hex),
    accent:     bare(c.accentColor.hex),
    regex:      bare(c.regexColor.hex),
  }
}

const CODE_ROWS: CodeRow[] = [
  { label: 'Editor Background',  key: 'editorBackground' },
  { label: 'Editor Foreground',  key: 'editorForeground' },
  { label: 'Sidebar Background', key: 'sidebarBackground' },
  { label: '', sep: true },
  { label: 'Comment',            key: 'comment' },
  { label: 'Keyword',            key: 'keyword' },
  { label: 'String',             key: 'string' },
  { label: 'Function / Def',     key: 'definition' },
  { label: 'Type / Class',       key: 'type' },
  { label: 'Number',             key: 'number' },
  { label: 'Variable',           key: 'variable' },
  { label: 'Operator',           key: 'operator' },
  { label: 'Accent (this/bool)', key: 'accent' },
  { label: 'Regex / Escape',     key: 'regex' },
]

// ─── UI token rows ────────────────────────────────────────────────────────────

interface UiRow {
  label: string
  sep?: boolean
  ourKey?: string
  md3Key?: string
  note?: string
}

type UiTokenMap = Record<string, string>

function extractUiTokens(c: SemanticColors, isDark: boolean): UiTokenMap {
  return {
    primary:              bare(c.focusBorder.hex),
    onPrimary:            deriveOn(c.focusBorder.hex, isDark),
    primaryContainer:     bare(c.primaryContainer.hex),
    onPrimaryContainer:   bare(c.onPrimaryContainer.hex),
    secondary:            bare(c.secondaryColor.hex),
    onSecondary:          bare(c.onSecondaryColor.hex),
    secondaryContainer:   bare(c.secondaryContainer.hex),
    onSecondaryContainer: bare(c.onSecondaryContainer.hex),
    surface:              bare(c.editorBackground.hex),
    onSurface:            bare(c.editorForeground.hex),
    surfaceVariant:       bare(c.panelBackground.hex),
    onSurfaceVariant:     bare(c.defaultForeground.hex),
    surfaceContainer:     bare(c.sidebarBackground.hex),
    outline:              bare(c.outline.hex),
    outlineVariant:       bare(c.outlineVariant.hex),
    error:                bare(c.errorForeground.hex),
    onError:              deriveOn(c.errorForeground.hex, isDark),
    errorContainer:       bare(c.errorContainer.hex),
    onErrorContainer:     bare(c.onErrorContainer.hex),
    warning:              bare(c.warningForeground.hex),
    warningContainer:     bare(c.warningContainer.hex),
    success:              bare(c.successForeground.hex),
    successContainer:     bare(c.successContainer.hex),
    info:                 bare(c.infoForeground.hex),
    infoContainer:        bare(c.infoContainer.hex),
  }
}

const UI_ROWS: UiRow[] = [
  { label: 'Primary',               ourKey: 'primary',              md3Key: 'primary' },
  { label: 'On Primary',            ourKey: 'onPrimary',            md3Key: 'onPrimary' },
  { label: 'Primary Container',     ourKey: 'primaryContainer',     md3Key: 'primaryContainer' },
  { label: 'On Primary Container',  ourKey: 'onPrimaryContainer',   md3Key: 'onPrimaryContainer' },
  { label: '', sep: true },
  { label: 'Secondary',             ourKey: 'secondary',            md3Key: 'secondary' },
  { label: 'On Secondary',          ourKey: 'onSecondary',          md3Key: 'onSecondary' },
  { label: 'Secondary Container',   ourKey: 'secondaryContainer',   md3Key: 'secondaryContainer' },
  { label: 'On Sec. Container',     ourKey: 'onSecondaryContainer', md3Key: 'onSecondaryContainer' },
  { label: '', sep: true },
  { label: 'Surface',               ourKey: 'surface',              md3Key: 'surface' },
  { label: 'On Surface',            ourKey: 'onSurface',            md3Key: 'onSurface' },
  { label: 'Surface Variant',       ourKey: 'surfaceVariant',       md3Key: 'surfaceVariant' },
  { label: 'On Surface Variant',    ourKey: 'onSurfaceVariant',     md3Key: 'onSurfaceVariant' },
  { label: 'Surface Container',     ourKey: 'surfaceContainer',     md3Key: 'surfaceContainer' },
  { label: 'Outline',               ourKey: 'outline',              md3Key: 'outline' },
  { label: 'Outline Variant',       ourKey: 'outlineVariant',       md3Key: 'outlineVariant' },
  { label: '', sep: true },
  { label: 'Error',                 ourKey: 'error',                md3Key: 'error' },
  { label: 'On Error',              ourKey: 'onError',              md3Key: 'onError' },
  { label: 'Error Container',       ourKey: 'errorContainer',       md3Key: 'errorContainer' },
  { label: 'On Error Container',    ourKey: 'onErrorContainer',     md3Key: 'onErrorContainer' },
  { label: '', sep: true },
  { label: 'Warning',               ourKey: 'warning',              note: 'no MD3 equiv' },
  { label: 'Warning Container',     ourKey: 'warningContainer',     note: 'no MD3 equiv' },
  { label: 'Success',               ourKey: 'success',              note: 'no MD3 equiv' },
  { label: 'Success Container',     ourKey: 'successContainer',     note: 'no MD3 equiv' },
  { label: 'Info',                  ourKey: 'info',                 note: 'no MD3 equiv' },
  { label: 'Info Container',        ourKey: 'infoContainer',        note: 'no MD3 equiv' },
]

// ── HTML rendering ───────────────────────────────────────────────────────────

function swatch(hex: string | undefined, bg: string): string {
  if (!hex) return `<td class="cell-empty">—</td>`
  const safe = bare(hex)
  const fg = textOn(safe)
  return `<td><div class="sw" style="background:${safe};color:${fg}">${safe.toUpperCase()}</div></td>`
}

function sepRow(colCount: number): string {
  return `<tr class="sep-row"><td colspan="${colCount}"></td></tr>`
}

function renderCodeSection(
  data: ThemeData,
  refs: typeof REFERENCE_CODE_THEMES,
  isDark: boolean,
): string {
  const our = extractCodeTokens(data.semanticColors)
  const filtered = refs.filter(r => r.isDark === isDark)
  const edBg = bare(data.semanticColors.editorBackground.hex)
  const colCount = 2 + filtered.length

  const thCells = filtered.map(r => `<th>${r.name}</th>`).join('')
  const rows = CODE_ROWS.map(row => {
    if (row.sep) return sepRow(colCount)
    const ourHex = row.key ? our[row.key] : undefined
    const refCells = filtered.map(r => swatch(row.key ? r.colors[row.key] : undefined, edBg)).join('')
    return `<tr>
      <td class="role">${row.label}</td>
      ${swatch(ourHex, edBg)}
      ${refCells}
    </tr>`
  }).join('\n')

  return `
  <section>
    <h2>Code Mode — Syntax Tokens</h2>
    <p class="note">Generated from ${seed} &nbsp;·&nbsp; ${isDark ? 'Dark' : 'Light'} mode &nbsp;·&nbsp; Reference: ${filtered.map(r => r.name).join(', ')}</p>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="role-col">Role</th>
          <th class="ours">Generated</th>
          ${thCells}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`
}

function renderUiSection(
  data: ThemeData,
  md3: typeof MD3_LIGHT,
  isDark: boolean,
): string {
  const our = extractUiTokens(data.semanticColors, isDark)
  const edBg = bare(data.semanticColors.editorBackground.hex)

  const rows = UI_ROWS.map(row => {
    if (row.sep) return sepRow(3)
    const ourHex = row.ourKey ? our[row.ourKey] : undefined
    const md3Hex = row.md3Key ? (md3 as Record<string, string>)[row.md3Key] : undefined
    const md3Cell = md3Hex
      ? swatch(md3Hex, edBg)
      : `<td class="cell-empty"><span class="note-badge">${row.note ?? '—'}</span></td>`
    return `<tr>
      <td class="role">${row.label}</td>
      ${swatch(ourHex, edBg)}
      ${md3Cell}
    </tr>`
  }).join('\n')

  return `
  <section>
    <h2>UI Mode — Semantic Tokens</h2>
    <p class="note">Generated from ${seed} &nbsp;·&nbsp; MD3 reference seed: <strong>${MD3_SEED}</strong> (${isDark ? 'dark' : 'light'})</p>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="role-col">Role</th>
          <th class="ours">Generated</th>
          <th>Material Design 3</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`
}

function css(data: ThemeData): string {
  const c = data.semanticColors
  const pageBg  = bare(c.editorBackground.hex)
  const pageFg  = bare(c.editorForeground.hex)
  const surface  = bare(c.sidebarBackground.hex)
  const border   = bare(c.outlineVariant.hex)
  const muted    = bare(c.commentColor.hex)
  const accent   = bare(c.focusBorder.hex)
  const oursBg   = bare(c.primaryContainer.hex)
  const oursFg   = bare(c.onPrimaryContainer.hex)
  const sepColor = bare(c.neutralBand.hex)

  return `
    :root {
      --bg: ${pageBg};
      --fg: ${pageFg};
      --surface: ${surface};
      --border: ${border};
      --muted: ${muted};
      --accent: ${accent};
      --ours-bg: ${oursBg};
      --ours-fg: ${oursFg};
      --sep: ${sepColor};
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      padding: 2.5rem 3rem 4rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    header { margin-bottom: 3rem; }
    header h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.4rem;
    }
    header p {
      font-size: 0.85rem;
      color: var(--muted);
    }
    header .seed-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.8rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.15rem 0.6rem;
    }
    .seed-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
    }
    section {
      margin-bottom: 4rem;
    }
    section h2 {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin-bottom: 0.4rem;
    }
    .note {
      font-size: 0.78rem;
      color: var(--muted);
      margin-bottom: 1.25rem;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 600px;
    }
    thead th {
      text-align: left;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--muted);
      padding: 0.4rem 0.6rem 0.6rem;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    thead th.ours {
      color: var(--ours-fg);
      background: var(--ours-bg);
      border-radius: 4px 4px 0 0;
    }
    tbody tr:hover td { background: rgba(128,128,128,0.06); }
    tbody td {
      padding: 0.35rem 0.6rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    td.role {
      font-size: 0.8rem;
      font-weight: 500;
      white-space: nowrap;
      min-width: 170px;
      color: var(--fg);
    }
    th.role-col { min-width: 170px; }
    .sw {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 130px;
      height: 44px;
      border-radius: 6px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      border: 1px solid rgba(128,128,128,0.18);
      font-weight: 500;
    }
    .cell-empty {
      color: var(--muted);
      font-size: 0.8rem;
      min-width: 130px;
    }
    .note-badge {
      display: inline-block;
      font-size: 0.7rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 0.15rem 0.4rem;
      color: var(--muted);
    }
    tr.sep-row td {
      height: 0.75rem;
      border-bottom: none;
      background: transparent;
    }
    table tbody tr.sep-row:hover td { background: transparent; }
  `
}

function renderPage(data: ThemeData, isDark: boolean): string {
  const md3 = isDark ? MD3_DARK : MD3_LIGHT
  const modeLabel = isDark ? 'Dark' : 'Light'
  const kindLabel = kindArg
  const styleLabel = styleArg

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Theme Comparison — ${modeLabel} | ${seed}</title>
  <style>${css(data)}</style>
</head>
<body>
  <header>
    <h1>Theme Comparison &mdash; ${modeLabel}</h1>
    <p>
      Seed&nbsp;
      <span class="seed-chip"><span class="seed-dot"></span>${seed}</span>
      &nbsp;&nbsp;·&nbsp;&nbsp;${kindLabel} / ${styleLabel}&nbsp;&nbsp;·&nbsp;&nbsp;Generated by color-palette-pro
    </p>
  </header>
  ${renderCodeSection(data, REFERENCE_CODE_THEMES, isDark)}
  ${renderUiSection(data, md3, isDark)}
</body>
</html>`
}

// ── Write output ─────────────────────────────────────────────────────────────

const outDir = path.join(__dirname, 'generated-themes', 'compare')
fs.mkdirSync(outDir, { recursive: true })

const darkHtml  = renderPage(darkData,  true)
const lightHtml = renderPage(lightData, false)

fs.writeFileSync(path.join(outDir, 'dark.html'),  darkHtml)
fs.writeFileSync(path.join(outDir, 'light.html'), lightHtml)

console.log(`seed:  ${seed}  (${kindArg} / ${styleArg})`)
console.log(`wrote: ${path.join(outDir, 'dark.html')}`)
console.log(`wrote: ${path.join(outDir, 'light.html')}`)
