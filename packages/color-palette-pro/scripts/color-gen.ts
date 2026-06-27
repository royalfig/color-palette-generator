/**
 * Visual catalog generator — run any time to eyeball every variation for a base color.
 *
 *   npx tsx scripts/color-gen.ts '#666633' [out.html]
 *
 * Renders, for one base color, the current output of everything the library produces:
 *   • Palettes  — 6 kinds × 4 styles
 *   • UI tokens — the full token set per kind × style, in light and dark
 *   • Code mode — a code-editor preview per kind × style, in light and dark
 *
 * Output defaults to scripts/catalog-<hex>.html (git-ignored). Open it in a browser. To see the
 * effect of a change: tweak src/palette/schemes.ts or src/palette/polish.ts and re-run.
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Color from 'colorjs.io'
import { createPalettes, generateCodeTheme } from '../src/index.ts'
import { POLISH } from '../src/palette/polish.ts'
import type { BaseColorData } from '../src/factory.ts'
import type { PaletteKinds, PaletteStyle } from '../src/types/types.ts'

const KINDS: { id: PaletteKinds; name: string }[] = [
  { id: 'ana', name: 'Analogous' },
  { id: 'com', name: 'Complementary' },
  { id: 'spl', name: 'Split Complementary' },
  { id: 'tri', name: 'Triadic' },
  { id: 'tet', name: 'Tetradic' },
  { id: 'tas', name: 'Tints & Shades' },
]
const STYLES: PaletteStyle[] = ['square', 'triangle', 'circle', 'diamond']
const SPACE = { space: 'srgb', format: 'hex' } as const

// ---- args ----
const baseColor = process.argv[2]
if (!baseColor) {
  console.error("usage: npx tsx scripts/color-gen.ts '#666633' [out.html]")
  process.exit(1)
}
let baseOklch: string
try {
  const c = new Color(baseColor)
  baseOklch = `L ${(c.oklch.l ?? 0).toFixed(2)}  C ${(c.oklch.c ?? 0).toFixed(3)}  H ${Math.round(c.oklch.h ?? 0)}`
} catch {
  console.error(`Not a valid color: ${baseColor}`)
  process.exit(1)
}

// ---- helpers ----
const hexOf = (sw: BaseColorData): string => sw.conversions[SPACE.format].value
const oklchTitle = (sw: BaseColorData): string => {
  const o = sw.color.oklch
  return `${sw.code}\nL ${(o.l ?? 0).toFixed(2)} C ${(o.c ?? 0).toFixed(3)} H ${Math.round(o.h ?? 0)}`
}

function swatch(sw: BaseColorData, label?: string): string {
  const hex = hexOf(sw)
  return `<div class="sw" style="background:${hex};color:${sw.contrast}" title="${oklchTitle(sw)}">
    <span class="lab">${label ?? ''}</span><span class="hex">${hex}</span></div>`
}

function paletteStrip(arr: BaseColorData[]): string {
  return `<div class="strip">${arr.map((sw, i) => swatch(sw, String(i))).join('')}</div>`
}

function uiGrid(arr: BaseColorData[]): string {
  return `<div class="ui">${arr.map(sw => swatch(sw, sw.code)).join('')}</div>`
}

// code-mode preview ----------------------------------------------------------
const semHex = (theme: any, key: string, fallback: string): string => {
  const v = theme.semanticTokenColors?.[key]
  if (!v) return fallback
  return typeof v === 'string' ? v : (v.foreground ?? fallback)
}

function codePreview(theme: any): string {
  const bg = theme.colors['editor.background']
  const fg = theme.colors['editor.foreground']
  const r = {
    kw: semHex(theme, 'keyword', fg),
    str: semHex(theme, 'string', fg),
    cmt: semHex(theme, 'comment', fg),
    fn: semHex(theme, 'function', fg),
    ty: semHex(theme, 'type', fg),
    num: semHex(theme, 'number', fg),
    vr: semHex(theme, 'variable', fg),
    op: semHex(theme, 'operator', fg),
    prop: semHex(theme, 'property', fg),
    bool: semHex(theme, 'boolean', fg),
  }
  const vars = `--kw:${r.kw};--str:${r.str};--cmt:${r.cmt};--fn:${r.fn};--ty:${r.ty};--num:${r.num};--vr:${r.vr};--op:${r.op};--prop:${r.prop};--bool:${r.bool}`
  const code = [
    `<span class="cmt">// pricing — generated sample</span>`,
    `<span class="kw">import</span> { computeTotal } <span class="kw">from</span> <span class="str">"./cart"</span>`,
    ``,
    `<span class="kw">type</span> <span class="ty">Tier</span> <span class="op">=</span> <span class="str">"free"</span> <span class="op">|</span> <span class="str">"pro"</span>`,
    `<span class="kw">const</span> <span class="vr">TAX</span> <span class="op">=</span> <span class="num">0.0825</span>`,
    ``,
    `<span class="kw">function</span> <span class="fn">priceFor</span>(<span class="vr">tier</span>: <span class="ty">Tier</span>): <span class="ty">number</span> {`,
    `  <span class="kw">if</span> (<span class="vr">tier</span> <span class="op">===</span> <span class="str">"pro"</span>) <span class="kw">return</span> <span class="num">20</span>`,
    `  <span class="kw">return</span> <span class="num">0</span>`,
    `}`,
    ``,
    `<span class="kw">const</span> <span class="vr">config</span> <span class="op">=</span> { <span class="prop">active</span>: <span class="bool">true</span>, <span class="prop">name</span>: <span class="str">"cart"</span> }`,
    `<span class="kw">export const</span> <span class="vr">total</span> <span class="op">=</span> <span class="fn">priceFor</span>(<span class="str">"pro"</span>) <span class="op">*</span> (<span class="num">1</span> <span class="op">+</span> <span class="vr">TAX</span>)`,
  ].join('\n')
  return `<pre class="code" style="background:${bg};color:${fg};${vars}">${code}</pre>`
}

// ---- build sections --------------------------------------------------------
let palettesHtml = ''
let uiHtml = ''
let codeHtml = ''

for (const { id, name } of KINDS) {
  // palettes (current output)
  let rows = ''
  for (const style of STYLES) {
    const pal = createPalettes(baseColor, id, style, SPACE) as BaseColorData[]
    rows += `<div class="prow"><div class="styname">${style}</div>${paletteStrip(pal)}</div>`
  }
  palettesHtml += `<h3>${name}</h3>${rows}`

  // ui tokens: light + dark (polished — the real output)
  let uiBlocks = ''
  for (const style of STYLES) {
    const light = createPalettes(baseColor, id, style, SPACE, [0, 0, 0, 0], true, false) as BaseColorData[]
    const dark = createPalettes(baseColor, id, style, SPACE, [0, 0, 0, 0], true, true) as BaseColorData[]
    uiBlocks += `<div class="uiblock"><h4>${style}</h4>
      <div class="modecol"><span class="modelab">light</span>${uiGrid(light)}</div>
      <div class="modecol"><span class="modelab">dark</span>${uiGrid(dark)}</div></div>`
  }
  uiHtml += `<details><summary>${name}</summary>${uiBlocks}</details>`

  // code mode: light + dark
  let codeBlocks = ''
  for (const style of STYLES) {
    const basePalette = createPalettes(baseColor, id, style, SPACE) as BaseColorData[]
    const baseC = new Color(baseColor)
    const lightTheme = generateCodeTheme(baseC, basePalette, false, id, style)
    const darkTheme = generateCodeTheme(baseC, basePalette, true, id, style)
    codeBlocks += `<div class="codeblock"><h4>${style}</h4>
      <div class="codepair">${codePreview(lightTheme)}${codePreview(darkTheme)}</div></div>`
  }
  codeHtml += `<details><summary>${name}</summary>${codeBlocks}</details>`
}

// ---- assemble --------------------------------------------------------------
const html = `<!doctype html><html><head><meta charset="utf-8">
<title>color catalog ${baseColor}</title>
<style>
  :root { color-scheme: dark; }
  body { background:#15151a; color:#e6e6ea; font:14px/1.5 -apple-system,system-ui,sans-serif; margin:0; padding:24px 32px 64px; }
  h1 { margin:0 0 4px; font-size:20px; }
  h2 { margin:36px 0 12px; padding-bottom:6px; border-bottom:1px solid #333; font-size:16px; letter-spacing:.04em; text-transform:uppercase; color:#9aa; }
  h3 { margin:24px 0 8px; font-size:15px; }
  h4 { margin:10px 0 6px; font-size:12px; color:#9aa; text-transform:capitalize; }
  .base { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
  .base .chip { width:48px; height:48px; border-radius:8px; border:1px solid #0006; }
  code { background:#0003; padding:1px 5px; border-radius:4px; }

  .prow { display:grid; grid-template-columns:80px 1fr; gap:10px; align-items:center; margin:6px 0; }
  .styname { font-size:12px; color:#9aa; text-transform:capitalize; }
  .strip { display:flex; gap:2px; border-radius:6px; overflow:hidden; }
  .strip .sw { flex:1; }

  .sw { min-width:0; height:46px; display:flex; flex-direction:column; justify-content:flex-end; padding:3px 4px; box-sizing:border-box; font-size:9px; overflow:hidden; }
  .sw .lab { opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sw .hex { font-family:ui-monospace,monospace; font-size:9px; }

  details { margin:6px 0; border:1px solid #2a2a32; border-radius:8px; padding:4px 10px; background:#1b1b22; }
  summary { cursor:pointer; font-weight:600; padding:4px 0; }
  .uiblock, .codeblock { margin:10px 0 16px; }
  .modecol { margin:6px 0; }
  .modelab { font-size:10px; color:#9aa; }
  .ui { display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:3px; margin-top:3px; }
  .ui .sw { height:40px; border-radius:4px; }

  .codepair { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .code { margin:0; padding:12px 14px; border-radius:8px; font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace; overflow:auto; white-space:pre; }
  .code .kw{color:var(--kw)} .code .str{color:var(--str)} .code .cmt{color:var(--cmt);font-style:italic}
  .code .fn{color:var(--fn)} .code .ty{color:var(--ty)} .code .num{color:var(--num)}
  .code .vr{color:var(--vr)} .code .op{color:var(--op)} .code .prop{color:var(--prop)} .code .bool{color:var(--bool)}
</style></head><body>
  <h1>Color catalog</h1>
  <div class="base"><div class="chip" style="background:${baseColor}"></div>
    <div><code>${baseColor}</code> &nbsp; ${baseOklch} &nbsp;·&nbsp; current output · polish <b>${POLISH.enabled ? 'ON' : 'OFF'}</b></div></div>

  <h2>Palettes</h2>
  ${palettesHtml}

  <h2>UI tokens — light &amp; dark</h2>
  ${uiHtml}

  <h2>Code mode — light &amp; dark</h2>
  ${codeHtml}
</body></html>`

const here = dirname(fileURLToPath(import.meta.url))
const slug = baseColor.replace(/[^0-9a-zA-Z]/g, '')
const outArg = process.argv[3]
const outPath = outArg ? resolve(process.cwd(), outArg) : resolve(here, `catalog-${slug}.html`)
writeFileSync(outPath, html)
console.log(`wrote ${outPath}`)
