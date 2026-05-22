import Color from 'colorjs.io'
import { createPalettes } from '../packages/color-palette-pro/src/index'
import { generateCodeTheme } from '../packages/color-palette-pro/src/code-mode'
import { deltaE } from '../packages/color-palette-pro/src/code-mode/utils'

const cases: Array<[string, string]> = [
  ['#7c3aed', 'com'], ['#fb923c', 'ana'], ['#0ea5e9', 'tas'], ['#22c55e', 'ton'],
]

for (const [base, kind] of cases) {
  const palette = createPalettes(base, kind as any, 'diamond', { space: 'oklch', format: 'oklch' }, [0, 0, 0, 0], false, true)
  const themeDark = generateCodeTheme(new Color(base), palette, true, kind as any, 'diamond')
  const themeLight = generateCodeTheme(new Color(base), palette, false, kind as any, 'diamond')
  console.log(`light bg: ${themeLight.colors['editor.background']} fg: ${themeLight.colors['editor.foreground']}`)
  // Show light-mode quiet roles
  const lightRoles: Record<string,string> = {}
  for (const r of themeLight.tokenColors) {
    const ss = Array.isArray(r.scope) ? r.scope : r.scope ? [r.scope] : []
    if (ss.includes('comment') && !lightRoles.comment) lightRoles.comment = r.settings.foreground
    if (ss.includes('punctuation.separator') && !lightRoles.punctuation) lightRoles.punctuation = r.settings.foreground
    if (ss.includes('variable') && !lightRoles.variable) lightRoles.variable = r.settings.foreground
  }
  console.log(`  light comment: ${lightRoles.comment} punctuation: ${lightRoles.punctuation} variable: ${lightRoles.variable}`)
  const theme = themeDark
  console.log(`\n=== ${base} / ${kind} / diamond / dark ===`)
  console.log('bg:', theme.colors['editor.background'], 'fg:', theme.colors['editor.foreground'])
  const sem = (theme as any) // for token introspection
  const roles: Record<string, string> = {}
  for (const rule of theme.tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : rule.scope ? [rule.scope] : []
    // Exact-match first scope only to avoid overlapping scope sets
    const has = (s: string) => scopes.includes(s)
    if (has('comment') && !roles.comment) roles.comment = rule.settings.foreground
    if (has('keyword') && !roles.keyword) roles.keyword = rule.settings.foreground
    if (has('string') && !roles.string) roles.string = rule.settings.foreground
    if (has('entity.name.function') && !roles.definition) roles.definition = rule.settings.foreground
    if (has('entity.name.type') && !roles.type) roles.type = rule.settings.foreground
    if (has('constant.numeric') && !roles.number) roles.number = rule.settings.foreground
    if (has('variable') && !roles.variable) roles.variable = rule.settings.foreground
    if (has('variable.other.property') && !roles.property) roles.property = rule.settings.foreground
    if (has('keyword.operator') && !roles.operator) roles.operator = rule.settings.foreground
    if (has('punctuation.separator') && !roles.punctuation) roles.punctuation = rule.settings.foreground
    if (has('string.regexp') && !roles.regex) roles.regex = rule.settings.foreground
    if (has('variable.language') && !roles.accent) roles.accent = rule.settings.foreground
  }
  console.log('roles:')
  for (const [k, v] of Object.entries(roles)) console.log(`  ${k.padEnd(11)} ${v}`)
  // Show min ΔE between loud roles
  const loudKeys = ['definition','keyword','type','string','number','regex','accent']
  let minDe = Infinity, minPair = ''
  for (let i = 0; i < loudKeys.length; i++) {
    for (let j = i+1; j < loudKeys.length; j++) {
      if (!roles[loudKeys[i]] || !roles[loudKeys[j]]) continue
      const de = deltaE(new Color(roles[loudKeys[i]]), new Color(roles[loudKeys[j]]))
      if (de < minDe) { minDe = de; minPair = `${loudKeys[i]}↔${loudKeys[j]}` }
    }
  }
  console.log(`min ΔE among loud roles: ${minDe.toFixed(1)} (${minPair})`)
}
