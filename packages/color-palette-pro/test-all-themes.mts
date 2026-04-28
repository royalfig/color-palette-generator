import Color from 'colorjs.io'
import { createPalettes } from './src/index'
import { generateCodeTheme, serializeTheme } from './src/code-mode'
import * as fs from 'fs'

const configs = [
  { kind: 'ana' as const, color: '#3b82f6', name: 'analogous-blue' },
  { kind: 'com' as const, color: '#7c3aed', name: 'complementary-violet' },
  { kind: 'spl' as const, color: '#059669', name: 'split-green' },
  { kind: 'tet' as const, color: '#dc2626', name: 'tetradic-red' },
  { kind: 'tri' as const, color: '#d97706', name: 'triadic-amber' },
  { kind: 'tas' as const, color: '#6366f1', name: 'tints-indigo' },
]

for (const cfg of configs) {
  try {
    const rawPalette = createPalettes(
      cfg.color,
      cfg.kind,
      'square',
      { space: 'oklch', format: 'oklch' },
      [0, 0, 0, 0],
      false,
      true,
    )
    
    const color = new Color(cfg.color)
    const theme = generateCodeTheme(color, rawPalette, true, cfg.kind)
    
    const jsonPath = `/home/ryan/Developer/color-palette-generator/${cfg.name}-dark.json`
    fs.writeFileSync(jsonPath, serializeTheme(theme))
    
    // Count distinct token colors (excluding defaults)
    const fgColors = new Set<string>()
    for (const r of theme.tokenColors) {
      if (r.settings.foreground && r.settings.foreground.startsWith('#')) {
        fgColors.add(r.settings.foreground)
      }
    }
    
    console.log(`✓ ${cfg.name}: bg=${theme.colors['editor.background']} fg=${theme.colors['editor.foreground']} | ${Object.keys(theme.colors).length} colors | ${theme.tokenColors.length} rules | ${fgColors.size} distinct token colors`)
  } catch (e: any) {
    console.log(`✗ ${cfg.name}: ${e.message}`)
    console.log(e.stack)
  }
}

console.log()
console.log('All themes generated:')
for (const cfg of configs) {
  console.log(`  ${cfg.name}-dark.json`)
}
