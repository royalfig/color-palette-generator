import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'palette-style-selector'
const title = 'Palette Style Selector'

export function PaletteStyleSelectorHeader() {
  return ManualHeader(id, title)
}

export function PaletteStyleSelector() {
  return (
    <Page id={id} title={title}>
      <p>
        The palette style selector doesn't just change how colors are displayed—it fundamentally changes how colors are
        generated. Each style uses a different color theory algorithm to create unique and purposeful palettes.
      </p>

      <h3>Color Generation Styles</h3>

      <h4>1. Square: Mathematics</h4>
      <p>Uses pure mathematical calculations with rigid angular relationships between colors.</p>

      <h4>2. Triangle: Perception</h4>
      <p>Based on opponent process theory and how human vision actually processes color.</p>

      <h4>3. Circle: Resonance</h4>
      <p>Creates palettes that tell emotional stories through color progressions.</p>

      <h4>4. Diamond: Luminosity</h4>
      <p>Based on the physics of light and how different light sources affect color perception.</p>
    </Page>
  )
}
