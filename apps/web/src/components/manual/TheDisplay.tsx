import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'the-display'
const title = 'The Display'

export function TheDisplayHeader() {
  return ManualHeader(id, title)
}

export function TheDisplay() {
  return (
    <Page id={id} title={title}>
      <p>The display comprises 4 main components.</p>
      <h3>1. Current Color Display</h3>
      <p>
        The current color display shows the selected color, it's given name, and the name of the current palette. "Magic
        Spell in Bats Black", e.g., signifies that the current color is named, "Bats Black," and the current palette is
        called, "Magic Spell."
      </p>
      <h3>2. Color Wheel</h3>
      <p>
        The color wheel provides a visual representation of the current palette, mapping colors by their hue and
        lightness.
      </p>
      <h3>3. Color Data Display</h3>
      <p>
        The color data display shows the current color's data points, i.e., its values in every color space and format.
        Click on any of these values to copy them.
      </p>
      <h3>4. Palette Display</h3>
      <p>
        The palette display shows the current palette, with each color being represented by a swatch. Clicking on a
        color swatch copies its value (in the current color space and format).
      </p>
      <p>
        The palette display will also show additional palette information or your color history, when those modes are
        engaged.
      </p>
    </Page>
  )
}
