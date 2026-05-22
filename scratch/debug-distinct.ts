import Color from 'colorjs.io'
import { createPalettes } from '../packages/color-palette-pro/src/index'
import { complementaryTemplate } from '../packages/color-palette-pro/src/code-mode/templates/complementary'
import { deltaE, nudgeForDistinction, toHex } from '../packages/color-palette-pro/src/code-mode/utils'
import { generateSurfaceColors, adaptPrimaryForMode } from '../packages/color-palette-pro/src/ui'

const base = '#7c3aed'
const palette = createPalettes(base, 'com', 'diamond', { space: 'oklch', format: 'oklch' }, [0,0,0,0], false, true)
const primary = adaptPrimaryForMode(new Color(base), true)
const surfaces = { ...generateSurfaceColors(primary, true), outline: primary.clone(), outlineVariant: primary.clone() }

const syn = complementaryTemplate.deriveColors(new Color(base), palette, true, surfaces as any)
console.log('Pre-distinction:')
console.log('  definition:', toHex(syn.definitionColor), 'oklch:', syn.definitionColor.oklch.l.toFixed(3), syn.definitionColor.oklch.c.toFixed(3), (syn.definitionColor.oklch.h ?? 0).toFixed(1))
console.log('  string:    ', toHex(syn.stringColor), 'oklch:', syn.stringColor.oklch.l.toFixed(3), syn.stringColor.oklch.c.toFixed(3), (syn.stringColor.oklch.h ?? 0).toFixed(1))
console.log('  ΔE:', deltaE(syn.definitionColor, syn.stringColor).toFixed(2))

const nudged = nudgeForDistinction(syn.stringColor, syn.definitionColor, true)
console.log('Post-nudge:')
console.log('  string:    ', toHex(nudged), 'oklch:', nudged.oklch.l.toFixed(3), nudged.oklch.c.toFixed(3), (nudged.oklch.h ?? 0).toFixed(1))
console.log('  ΔE:', deltaE(syn.definitionColor, nudged).toFixed(2))
