import Color from 'colorjs.io'
import { createPalettes } from './src/index'
import { generateCodeTheme, generateCodeThemePair, serializeTheme } from './src/code-mode'

const baseColor = '#7c3aed'
const paletteKind = 'com' as const
const isDarkMode = true

const rawPalette = createPalettes(
  baseColor,
  paletteKind,
  'square',
  { space: 'oklch', format: 'oklch' },
  [0, 0, 0, 0],
  false,
  isDarkMode,
)

const color = new Color(baseColor)

console.log('=== Generating dark theme ===')
console.log(`Palette kind: ${paletteKind}`)
console.log(`Base color: ${baseColor}`)
console.log(`Raw palette length: ${rawPalette.length}`)
console.log()

const theme = generateCodeTheme(color, rawPalette, isDarkMode, paletteKind)

console.log(`Theme name: ${theme.name}`)
console.log(`Display name: ${theme.displayName}`)
console.log(`Type: ${theme.type}`)
console.log(`UI colors count: ${Object.keys(theme.colors).length}`)
console.log(`Token rules count: ${theme.tokenColors.length}`)
console.log()

// Sample UI colors
console.log('--- Sample UI Colors ---')
const sampleKeys = [
  'editor.background', 'editor.foreground',
  'sidebar.background', 'statusBar.background',
  'focusBorder', 'input.background',
]
for (const key of sampleKeys) {
  console.log(`  ${key}: ${theme.colors[key]}`)
}

// Sample token rules
console.log()
console.log('--- Sample Token Rules ---')
const sampleRules = theme.tokenColors.slice(0, 8)
for (const rule of sampleRules) {
  const scopes = Array.isArray(rule.scope) ? rule.scope.join(', ') : rule.scope || '(default)'
  console.log(`  ${scopes}: ${rule.settings.foreground}`)
}

// Test pair generation
console.log()
console.log('=== Theme Pair ===')
const pair = generateCodeThemePair(color, rawPalette, paletteKind)
console.log(`Dark:  ${pair.dark.name} (${pair.dark.type})`)
console.log(`Light: ${pair.light.name} (${pair.light.type})`)

// Write full JSON to file
const fs = await import('fs')
const jsonPath = '/home/ryan/Developer/color-palette-generator/complementary-dark.json'
fs.writeFileSync(jsonPath, serializeTheme(theme))
console.log()
console.log(`Full theme written to: ${jsonPath}`)
