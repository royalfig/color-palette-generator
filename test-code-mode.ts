import Color from 'colorjs.io'
import { createPalettes, type BaseColorData } from './packages/color-palette-pro/src/index'
import { generateCodeTheme, generateCodeThemePair, serializeTheme, serializeThemePair } from './packages/color-palette-pro/src/code-mode'

// Test with a base color
const baseColor = '#7c3aed' // violet
const paletteKind = 'com' as const
const isDarkMode = true

// Generate the base palette (same way the app does)
const rawPalette = createPalettes(
  baseColor,
  paletteKind,
  'square',
  { space: 'oklch', format: 'oklch' },
  [0, 0, 0, 0],
  false,  // not UI mode
  isDarkMode,
)

// Create a proper Color object for the API
const color = new Color(baseColor)

console.log('=== Generating dark theme ===')
console.log(`Palette kind: ${paletteKind}`)
console.log(`Base color: ${baseColor}`)
console.log(`Raw palette length: ${rawPalette.length}`)
console.log()

// Generate the code theme
const theme = generateCodeTheme(color, rawPalette, isDarkMode, paletteKind, 'square')

console.log(`Theme name: ${theme.name}`)
console.log(`Display name: ${theme.displayName}`)
console.log(`Type: ${theme.type}`)
console.log(`UI colors count: ${Object.keys(theme.colors).length}`)
console.log(`Token rules count: ${theme.tokenColors.length}`)
console.log()

// Print a sample of UI colors
console.log('--- Sample UI Colors ---')
const sampleKeys = [
  'editor.background', 'editor.foreground',
  'sidebar.background', 'statusBar.background',
  'focusBorder', 'input.background',
]
for (const key of sampleKeys) {
  console.log(`  ${key}: ${theme.colors[key]}`)
}

// Print a sample of token rules
console.log()
console.log('--- Sample Token Rules ---')
const sampleRules = theme.tokenColors.slice(0, 8)
for (const rule of sampleRules) {
  const scopes = Array.isArray(rule.scope) ? rule.scope.join(', ') : rule.scope || '(default)'
  console.log(`  ${scopes}: ${rule.settings.foreground}`)
}

// Also test the pair generator
console.log()
console.log('=== Generating theme pair ===')
const pair = generateCodeThemePair(color, rawPalette, paletteKind, 'square')
console.log(`Dark:  ${pair.dark.name} (${pair.dark.type})`)
console.log(`Light: ${pair.light.name} (${pair.light.type})`)

// Serialize and write to file
const serialized = serializeTheme(theme)
console.log()
console.log('=== Serialized (first 2000 chars) ===')
console.log(serialized.substring(0, 2000))
