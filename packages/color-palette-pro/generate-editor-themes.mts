/**
 * Generate every theme permutation for a single seed color, in Zed and Ghostty formats.
 *
 *   7 palette kinds × 4 styles × 2 modes = 56 themes per format.
 *
 * Zed:     valid theme JSON — drop any file in ~/.config/zed/themes/
 * Ghostty: config snippet  — paste into ~/.config/ghostty/config (or a themes/ file)
 *
 * Usage:
 *   npx tsx generate-editor-themes.mts                 # random seed
 *   npx tsx generate-editor-themes.mts '#7FFF00'       # explicit seed (chartreuse)
 *
 * Output:
 *   generated-themes/<format>/<seed-hex>/<kind>-<style>-<mode>[.json]
 */

import Color from 'colorjs.io'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createPalettes, pickRandomColor, generateTheme } from './src/index'
import type { PaletteKinds, PaletteStyle } from './src/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const FORMATS: { fmt: 'zed' | 'ghostty'; ext: string }[] = [
  { fmt: 'zed',     ext: '.json' },
  { fmt: 'ghostty', ext: '' },
]

function toHexSlug(input: string): string {
  const c = new Color(input).to('srgb')
  const ch = (n: number): string => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0')
  return ch(c.coords[0]) + ch(c.coords[1]) + ch(c.coords[2])
}

const seed = process.argv[2] ?? pickRandomColor()
const seedSlug = toHexSlug(seed)
const baseColor = new Color(seed)

console.log(`seed: ${seed}  (slug ${seedSlug})`)

let ok = 0
let fail = 0
const failures: string[] = []

for (const { fmt, ext } of FORMATS) {
  const outDir = path.join(__dirname, 'generated-themes', fmt, seedSlug)
  fs.mkdirSync(outDir, { recursive: true })

  for (const { kind, label: kindLabel } of KINDS) {
    for (const style of STYLES) {
      // createPalettes once per (kind × style); both modes share the palette.
      const palette = createPalettes(
        seed, kind, style, { space: 'oklch', format: 'oklch' }, [0, 0, 0, 0], false, true,
      )
      for (const { isDark, label: modeLabel } of MODES) {
        try {
          const content = generateTheme(baseColor, palette, isDark, kind, style, fmt)
          fs.writeFileSync(path.join(outDir, `${kindLabel}-${style}-${modeLabel}${ext}`), content)
          ok++
        } catch (e: unknown) {
          failures.push(`${fmt} ${kindLabel}/${style}/${modeLabel}: ${e instanceof Error ? e.message : String(e)}`)
          fail++
        }
      }
    }
  }
  console.log(`  ${fmt}: wrote to ${path.relative(__dirname, outDir)}`)
}

console.log(`\ngenerated: ${ok}/${ok + fail}`)
if (failures.length) {
  console.log('failures:')
  for (const f of failures) console.log(`  ${f}`)
}
