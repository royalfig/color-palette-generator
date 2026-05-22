import Color from 'colorjs.io'
import { createPalettes } from './src/index'
import { generateCodeTheme, serializeTheme } from './src/code-mode'
import * as fs from 'fs'

const rawPalette = createPalettes('#7c3aed', 'com', 'square', { space: 'oklch', format: 'oklch' }, [0, 0, 0, 0], false, true)
const color = new Color('#7c3aed')
const theme = generateCodeTheme(color, rawPalette, true, 'com')

// Count distinct colors and fontStyle rules
const fgColors = new Set<string>()
let fontStyleCount = 0
for (const r of theme.tokenColors) {
  const fg = r.settings.foreground
  if (fg && fg.startsWith('#')) fgColors.add(fg)
  if ('fontStyle' in r.settings) fontStyleCount++
}

fs.writeFileSync('/home/ryan/Developer/color-palette-generator/complementary-dark.json', serializeTheme(theme))
console.log('Regenerated complementary-dark.json')
console.log(`  Distinct token colors: ${fgColors.size}`)
console.log(`  fontStyle rules: ${fontStyleCount}`)
console.log(`  comment color: ${theme.tokenColors.find((r: any) => Array.isArray(r.scope) && r.scope.some((s: string) => s.includes('comment') && !s.includes('docstring')))?.settings.foreground || '-'}`)
