import Color from 'colorjs.io'
import { createPalettes } from '../packages/color-palette-pro/src/index'
import { generateCodeTheme } from '../packages/color-palette-pro/src/code-mode'
import { deltaE, toHex } from '../packages/color-palette-pro/src/code-mode/utils'

const base = '#7c3aed'
const palette = createPalettes(base, 'com', 'diamond', { space: 'oklch', format: 'oklch' }, [0,0,0,0], false, true)
const theme = generateCodeTheme(new Color(base), palette, true, 'com', 'diamond')

// Pull out the SemanticColors by inspecting the token rules
const tokens = theme.tokenColors
const keywordRule = tokens.find(r => Array.isArray(r.scope) && r.scope.includes('keyword'))
const definitionRule = tokens.find(r => Array.isArray(r.scope) && r.scope.includes('entity.name.function'))
const stringRule = tokens.find(r => Array.isArray(r.scope) && r.scope.includes('string'))
const accentRule = tokens.find(r => Array.isArray(r.scope) && r.scope.includes('variable.language'))

console.log('keyword:    ', keywordRule?.settings.foreground)
console.log('definition: ', definitionRule?.settings.foreground)
console.log('string:     ', stringRule?.settings.foreground)
console.log('accent:     ', accentRule?.settings.foreground)

if (keywordRule && accentRule) {
  const k = new Color(keywordRule.settings.foreground)
  const a = new Color(accentRule.settings.foreground)
  console.log('keyword OKLCH:', k.oklch.l.toFixed(3), k.oklch.c.toFixed(3), (k.oklch.h ?? 0).toFixed(1))
  console.log('accent  OKLCH:', a.oklch.l.toFixed(3), a.oklch.c.toFixed(3), (a.oklch.h ?? 0).toFixed(1))
  console.log('ΔE(k,a):', deltaE(k, a).toFixed(2))
}
