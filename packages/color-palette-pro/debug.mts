import Color from 'colorjs.io'
import { createPalettes } from './src/index'
import { generateCodeTheme, serializeTheme } from './src/code-mode'
import { deriveUiColors } from './src/code-mode/templates/base'

const rawPalette = createPalettes(
  '#7c3aed',
  'com',
  'square',
  { space: 'oklch', format: 'oklch' },
  [0, 0, 0, 0],
  false,
  false,
  true,
)

const color = new Color('#7c3aed')
const theme = generateCodeTheme(color, rawPalette, true, 'com')

console.log('theme:', typeof theme)
console.log('theme.colors:', typeof theme.colors, Object.keys(theme.colors || {}).slice(0, 5))
console.log('editor.background:', theme.colors?.['editor.background'])
console.log('sidebar.background:', theme.colors?.['sideBar.background'])

// Check if deriveUiColors works
const semantic = theme.tokenColors ? null : null // dummy
