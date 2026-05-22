import Color from 'colorjs.io'
import { createPalettes, type BaseColorData } from '../packages/color-palette-pro/src/index'
import { generateCodeThemePair } from '../packages/color-palette-pro/src/code-mode'
import type { PaletteKinds, PaletteStyle } from '../packages/color-palette-pro/src/types'

const kinds: PaletteKinds[] = ['ana', 'com', 'spl', 'tri', 'tet', 'tas', 'ton']
const styles: PaletteStyle[] = ['square', 'triangle', 'circle', 'diamond']
const bases = ['#7c3aed', '#fb923c', '#0ea5e9']

let ok = 0
let fail = 0
const failures: string[] = []

for (const base of bases) {
  for (const kind of kinds) {
    for (const style of styles) {
      try {
        const palette: BaseColorData[] = createPalettes(
          base, kind, style,
          { space: 'oklch', format: 'oklch' },
          [0, 0, 0, 0], false, true,
        )
        const pair = generateCodeThemePair(new Color(base), palette, kind, style)
        // Spot-check required keys
        const requiredKeys = [
          'editor.background', 'editor.foreground', 'sideBar.background',
          'editorBracketHighlight.foreground1', 'editorBracketHighlight.foreground6',
          'terminal.ansiBlue', 'panel.background', 'editorInlayHint.foreground',
        ]
        for (const k of requiredKeys) {
          if (!pair.dark.colors[k] || !pair.light.colors[k]) {
            throw new Error(`Missing key ${k}`)
          }
        }
        if (pair.dark.tokenColors.length < 30) throw new Error('Too few token rules')
        ok++
      } catch (e) {
        fail++
        failures.push(`${base}/${kind}/${style}: ${(e as Error).message}`)
      }
    }
  }
}

console.log(`OK: ${ok}, FAIL: ${fail}`)
if (failures.length) {
  console.log('Failures:')
  for (const f of failures.slice(0, 20)) console.log(' -', f)
}
