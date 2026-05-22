/**
 * Generate every theme permutation for a single seed color.
 *
 *   7 palette kinds × 4 styles × 2 modes = 56 themes per run.
 *
 * Usage:
 *   npx tsx generate-all-themes.mts                 # random seed
 *   npx tsx generate-all-themes.mts '#7c3aed'       # explicit seed
 *
 * Output:
 *   generated-themes/<seed-or-name>/<kind>-<style>-<mode>.json
 */

import Color from 'colorjs.io'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createPalettes, pickRandomColor } from './src/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import { generateCodeTheme, serializeTheme } from './src/code-mode'
import type { PaletteKinds, PaletteStyle } from './src/types'

const KINDS: { kind: PaletteKinds; label: string }[] = [
  { kind: 'ana', label: 'analogous' },
  { kind: 'com', label: 'complementary' },
  { kind: 'spl', label: 'split-complementary' },
  { kind: 'tet', label: 'tetradic' },
  { kind: 'tri', label: 'triadic' },
  { kind: 'tas', label: 'tints-and-shades' },
  { kind: 'ton', label: 'tones' },
]

const STYLES: PaletteStyle[] = ['square', 'triangle', 'circle', 'diamond']
const MODES: { isDark: boolean; label: 'dark' | 'light' }[] = [
  { isDark: true,  label: 'dark' },
  { isDark: false, label: 'light' },
]

// Normalize whatever color string the caller supplies (hex, oklch(...), css name)
// down to a 6-char hex slug for the output folder name.
function toHexSlug(input: string): string {
  const c = new Color(input).to('srgb')
  const channel = (n: number): string => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0')
  return channel(c.coords[0]) + channel(c.coords[1]) + channel(c.coords[2])
}

const seedArg = process.argv[2]
const seed = seedArg ?? pickRandomColor()
const seedSlug = toHexSlug(seed)

const outDir = path.join(__dirname, 'generated-themes', seedSlug)
fs.mkdirSync(outDir, { recursive: true })

const baseColor = new Color(seed)

console.log(`seed: ${seed}`)
console.log(`out:  ${outDir}`)
console.log()

let ok = 0
let fail = 0
const failures: string[] = []

for (const { kind, label: kindLabel } of KINDS) {
  for (const style of STYLES) {
    try {
      // createPalettes once per (kind × style), then both modes share the palette.
      const palette = createPalettes(
        seed,
        kind,
        style,
        { space: 'oklch', format: 'oklch' },
        [0, 0, 0, 0],
        false,
        true,
      )

      for (const { isDark, label: modeLabel } of MODES) {
        const theme = generateCodeTheme(baseColor, palette, isDark, kind, style)
        const filename = `${kindLabel}-${style}-${modeLabel}.json`
        fs.writeFileSync(path.join(outDir, filename), serializeTheme(theme))
        ok++
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      failures.push(`${kindLabel}/${style}: ${msg}`)
      fail += MODES.length
    }
  }
}

console.log(`generated: ${ok}/${ok + fail}`)
if (failures.length) {
  console.log()
  console.log('failures:')
  for (const f of failures) console.log(`  ${f}`)
}
