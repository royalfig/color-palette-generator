import { readFileSync } from 'node:fs'
import Color from 'colorjs.io'

const recs: any[] = JSON.parse(readFileSync('scripts/dump/dump.json', 'utf8'))

const cache = new Map<string, Color>()
function C(hex: string): Color {
  let c = cache.get(hex)
  if (!c) { c = new Color(hex); cache.set(hex, c) }
  return c
}
function comp(fgHex: string, bgHex: string): string {
  // composite fg (possibly #RRGGBBAA) over opaque bg
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(fgHex)
  if (!m) return fgHex
  const a = m[2] === undefined ? 1 : parseInt(m[2], 16) / 255
  const f = new Color('#' + m[1]).to('srgb').coords
  const b = new Color(bgHex.slice(0, 7)).to('srgb').coords
  const out = [0, 1, 2].map(i => f[i] * a + b[i] * (1 - a))
  return new Color('srgb', out as any).toString({ format: 'hex' })
}
function apca(fg: string, bg: string) { return Math.abs(new Color(bg).contrastAPCA(new Color(fg))) }
function wcag(fg: string, bg: string) { return C(fg).contrastWCAG21(C(bg)) }

const CVD: Record<string, number[][]> = {
  protan: [[0.1121,0.8853,-0.0005],[0.1127,0.8897,-0.0001],[0.0045,0,1.0019]],
  deutan: [[0.292,0.7054,-0.0003],[0.2934,0.7089,0.0004],[-0.0209,0.0257,0.9971]],
  tritan: [[1.0175,0.0273,-0.0453],[-0.011,0.9587,0.0523],[0.0038,0.0937,0.9025]],
}
const simCache = new Map<string, string>()
function sim(hex: string, k: string): string {
  const key = k + hex
  let v = simCache.get(key)
  if (v) return v
  const m = CVD[k]
  const [r, g, b] = new Color(hex.slice(0,7)).to('srgb-linear').coords
  const out = m.map(row => row[0]*r + row[1]*g + row[2]*b)
  v = new Color('srgb-linear', out as any).to('srgb').toString({ format: 'hex' })
  simCache.set(key, v)
  return v
}
function dE(a: string, b: string) { return new Color(a).deltaEOK(new Color(b)) * 100 }

const out: any[] = []
const ROLES = ['keyword','string','type','number','definition','regex','accent','variable','property','operator','punctuation','comment']
const LOUD = ROLES.slice(0,7)

for (const r of recs) {
  const ch = r.chrome
  const bg = ch['editor.background']
  const tok: Record<string,string> = Object.fromEntries(Object.entries(r.tokens).map(([k,v]: any) => [k, v.hex]))
  const tag = `${r.seed} ${r.kind}/${r.style}/${r.mode}`

  // --- CVD collapse among all 12 roles + among loud
  const cvdPairs: any[] = []
  for (const k of ['protan','deutan','tritan']) {
    for (let i=0;i<ROLES.length;i++) for (let j=i+1;j<ROLES.length;j++) {
      const a = tok[ROLES[i]], b = tok[ROLES[j]]
      if (!a || !b) continue
      const d = dE(sim(a,k), sim(b,k))
      cvdPairs.push({ k, pair: ROLES[i]+'/'+ROLES[j], d: +d.toFixed(2), loud: i<7 && j<7 })
    }
  }

  // --- selection composite
  const selBg = comp(ch['editor.selectionBackground'], bg)
  const findBg = comp(ch['editor.findMatchBackground'], bg)
  const findHl = comp(ch['editor.findMatchHighlightBackground'], bg)
  const wordHl = comp(ch['editor.wordHighlightStrongBackground'], bg)
  const lineHl = ch['editor.lineHighlightBackground']
  const selApca: Record<string,number> = {}
  for (const role of ROLES) if (tok[role]) selApca[role] = +apca(tok[role], selBg).toFixed(1)
  const findApca: Record<string,number> = {}
  for (const role of ROLES) if (tok[role]) findApca[role] = +apca(tok[role], findBg).toFixed(1)
  const findHlApca: Record<string,number> = {}
  for (const role of ROLES) if (tok[role]) findHlApca[role] = +apca(tok[role], findHl).toFixed(1)

  // --- brackets (alpha composited)
  const brackets = [1,2,3,4,5,6].map(i => comp(ch[`editorBracketHighlight.foreground${i}`], bg))
  const bracketApca = brackets.map(b => +apca(b, bg).toFixed(1))
  let bracketMinDe = Infinity, bracketPair=''
  for (let i=0;i<6;i++) for (let j=i+1;j<6;j++) { const d=dE(brackets[i],brackets[j]); if (d<bracketMinDe){bracketMinDe=d;bracketPair=`${i+1}/${j+1}`} }
  const bracketCvd: Record<string,number> = {}
  for (const k of ['protan','deutan','tritan']) {
    let m=Infinity
    for (let i=0;i<6;i++) for (let j=i+1;j<6;j++) m=Math.min(m, dE(sim(brackets[i],k), sim(brackets[j],k)))
    bracketCvd[k]=+m.toFixed(2)
  }

  // --- chrome recessed elements vs their bg
  const vs = (fgKey: string, bgKey: string) => {
    const f = ch[fgKey], b = ch[bgKey]
    if (!f || !b) return null
    return +apca(comp(f, b), b.slice(0,7)).toFixed(1)
  }
  const chromeApca = {
    lineNumber: vs('editorLineNumber.foreground','editor.background'),
    lineNumberActive: vs('editorLineNumber.activeForeground','editor.background'),
    indentGuide: vs('editorIndentGuide.background','editor.background'),
    indentGuideActive: vs('editorIndentGuide.activeBackground','editor.background'),
    whitespace: vs('editorWhitespace.foreground','editor.background'),
    ruler: vs('editorRuler.foreground','editor.background'),
    codeLens: vs('editorCodeLens.foreground','editor.background'),
    inlayHint: (() => { const b = comp(ch['editorInlayHint.background'], bg); return +apca(comp(ch['editorInlayHint.foreground'], b), b).toFixed(1) })(),
    tabInactive: vs('tab.inactiveForeground','tab.inactiveBackground'),
    tabActive: vs('tab.activeForeground','tab.activeBackground'),
    placeholder: vs('input.placeholderForeground','input.background'),
    disabled: vs('disabledForeground','editor.background'),
    description: vs('descriptionForeground','sideBar.background'),
    sideBarFg: vs('sideBar.foreground','sideBar.background'),
    statusBarFg: vs('statusBar.foreground','statusBar.background'),
    breadcrumb: vs('breadcrumb.foreground','breadcrumb.background'),
    panelTitleInactive: vs('panelTitle.inactiveForeground','panel.background'),
    activityBarInactive: vs('activityBar.inactiveForeground','activityBar.background'),
    listInactiveSelFg: vs('list.inactiveSelectionForeground','list.inactiveSelectionBackground'),
    suggestFg: vs('editorSuggestWidget.foreground','editorSuggestWidget.background'),
    peekLine: vs('peekViewResult.lineForeground','peekViewResult.background'),
    terminalFg: vs('terminal.foreground','terminal.background'),
    editorFg: vs('editor.foreground','editor.background'),
    comment: +apca(tok.comment, bg).toFixed(1),
  }

  // --- semantics in editor chrome
  const semKeys = { error: 'editorError.foreground', warning: 'editorWarning.foreground', info: 'editorInfo.foreground' }
  const sem = Object.fromEntries(Object.entries(semKeys).map(([k,v]) => [k, ch[v]]))
  const semApca = Object.fromEntries(Object.entries(sem).map(([k,v]: any) => [k, +apca(v, bg).toFixed(1)]))
  const semCvd: Record<string,number> = {}
  for (const k of ['protan','deutan','tritan']) {
    const pairs: [string,string][] = [['error','warning'],['error','info'],['warning','info']]
    for (const [a,b] of pairs) semCvd[`${k}:${a}/${b}`] = +dE(sim(sem[a] as string,k), sim(sem[b] as string,k)).toFixed(2)
  }
  // git decoration / gutter diff
  const gutter = { added: ch['editorGutter.addedBackground'], deleted: ch['editorGutter.deletedBackground'], modified: ch['editorGutter.modifiedBackground'] }
  const gutterCvd: Record<string,number> = {}
  for (const k of ['protan','deutan','tritan']) {
    gutterCvd[`${k}:add/del`] = +dE(sim(comp(gutter.added,bg),k), sim(comp(gutter.deleted,bg),k)).toFixed(2)
  }
  const gutterApca = Object.fromEntries(Object.entries(gutter).map(([k,v]:any)=>[k,+apca(comp(v,bg),bg).toFixed(1)]))
  // diff line backgrounds
  const diffIns = comp(ch['diffEditor.insertedLineBackground'], bg)
  const diffDel = comp(ch['diffEditor.removedLineBackground'], bg)
  const diffCvd: Record<string,number> = {}
  for (const k of ['protan','deutan','tritan']) diffCvd[k] = +dE(sim(diffIns,k), sim(diffDel,k)).toFixed(2)
  const diffDeNormal = +dE(diffIns, diffDel).toFixed(2)
  const diffInsVsBg = +dE(diffIns, bg).toFixed(2)
  const diffDelVsBg = +dE(diffDel, bg).toFixed(2)
  // text readability on diff lines
  const diffTextWorst = Math.min(...ROLES.filter(x=>tok[x]).map(x => apca(tok[x], diffIns)), ...ROLES.filter(x=>tok[x]).map(x => apca(tok[x], diffDel)))

  out.push({ seed:r.seed, kind:r.kind, style:r.style, mode:r.mode, tag, bg,
    cvdPairs, selBg, findBg, findHl, wordHl, lineHl, selApca, findApca, findHlApca,
    brackets, bracketApca, bracketMinDe:+bracketMinDe.toFixed(2), bracketPair, bracketCvd,
    chromeApca, sem, semApca, semCvd, gutter, gutterCvd, gutterApca,
    diffCvd, diffDeNormal, diffInsVsBg, diffDelVsBg, diffTextWorst:+diffTextWorst.toFixed(1),
    tok,
  })
}
console.log(JSON.stringify(out))
