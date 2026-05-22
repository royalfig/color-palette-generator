import Color from 'colorjs.io'
import { deltaE, toHex, nudgeForDistinction } from '../packages/color-palette-pro/src/code-mode/utils'

// Simulate what enforceDistinction sees for keyword vs accent in com/diamond:
// Both at L 0.92, C 0.25 (clamped by applyContrastProfile), H 87°.
const keyword = new Color('oklch', [0.92, 0.25, 87])
const accent = new Color('oklch', [0.92, 0.25, 87])
console.log('keyword OKLCH coords:', keyword.coords)
console.log('accent  OKLCH coords:', accent.coords)
console.log('ΔE:', deltaE(keyword, accent).toFixed(2))
console.log('keyword hex:', toHex(keyword))
console.log('accent  hex:', toHex(accent))

const nudged = nudgeForDistinction(accent, keyword, true)
console.log('--- after nudge ---')
console.log('accent OKLCH coords:', nudged.coords)
console.log('accent hex:', toHex(nudged))
console.log('ΔE:', deltaE(keyword, nudged).toFixed(2))
