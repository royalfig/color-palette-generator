import Color from 'colorjs.io'
import { createPalettes } from '../packages/color-palette-pro/src/index'
import { generateCodeTheme } from '../packages/color-palette-pro/src/code-mode'

const base = '#7c3aed'
const kind = (process.argv[2] as any) ?? 'com'
const styles = ['square', 'triangle', 'circle', 'diamond'] as const

for (const style of styles) {
  const palette = createPalettes(base, kind, style, { space: 'oklch', format: 'oklch' }, [0,0,0,0], false, true)
  const theme = generateCodeTheme(new Color(base), palette, true, kind, style)
  console.log(`\n=== ${kind} / ${style} / dark ===`)
  console.log('bg:', theme.colors['editor.background'])
  // Print first 4 palette swatch hexes to see how the palette itself differs
  console.log('palette c0..c3:', palette.slice(0,4).map((p: any) => {
    const c = p.color.to('srgb').toGamut()
    const hex = '#' + [c.coords[0], c.coords[1], c.coords[2]].map(v => Math.round(v*255).toString(16).padStart(2,'0')).join('').toUpperCase()
    return hex
  }).join(' '))
  // Show 5 syntax role colors
  const roles: Record<string,string> = {}
  for (const r of theme.tokenColors) {
    const ss = Array.isArray(r.scope) ? r.scope : r.scope ? [r.scope] : []
    if (ss.includes('keyword') && !roles.keyword) roles.keyword = r.settings.foreground
    if (ss.includes('entity.name.function') && !roles.definition) roles.definition = r.settings.foreground
    if (ss.includes('string') && !roles.string) roles.string = r.settings.foreground
    if (ss.includes('comment') && !roles.comment) roles.comment = r.settings.foreground
  }
  console.log('  definition:', roles.definition, 'keyword:', roles.keyword, 'string:', roles.string, 'comment:', roles.comment)
  // Sample a token rule's fontStyle to see if italic shows up
  const commentRule = theme.tokenColors.find(r => Array.isArray(r.scope) && r.scope.includes('comment'))
  console.log('  comment fontStyle:', commentRule?.settings.fontStyle ?? '(none)')
  const kwRule = theme.tokenColors.find(r => Array.isArray(r.scope) && r.scope.includes('keyword'))
  console.log('  keyword fontStyle:', kwRule?.settings.fontStyle ?? '(none)')
}
