import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'palette-tools'
const title = 'Palette Tools'

export function PaletteToolsHeader() {
  return ManualHeader(id, title)
}

export function PaletteTools() {
  return (
    <Page id={id} title={title}>
      <p>
        The palette tools provide essential controls for viewing palette information, reviewing color history, switching
        between modes, and adjusting the interface theme.
      </p>
      <h3>1. Info Button (Information Display)</h3>
      <p>
        Click the <strong>Info</strong> button to display detailed information about each color in your current palette.
        When active, the palette display shows:
      </p>
      <ul>
        <li>Color names and values.</li>
      </ul>

      <h3>2. History Button (Color History)</h3>
      <p>
        The <strong>History</strong> button (rewind icon) reveals previous color selections (up to 240). Click any
        historical color to make it your current selection.
      </p>

      <h3>3. App Mode Button (UI Mode Toggle)</h3>
      <p>
        The <strong>App Mode</strong> button switches between two distinct palette generation modes.
      </p>
      <ul>
        <li>
          <strong>Palette Mode (Default):</strong> Generates palettes according to the color theory principles of the
          selected palette type.
        </li>
        <li>
          <strong>UI Mode:</strong> Generates palettes for use in UIs.
        </li>
      </ul>

      <h3>4. Dark Mode Toggle</h3>
      <p>
        The <strong>Moon/Sun</strong> button toggles between light and dark mode. Note that this also affects UI mode.
        Light mode generates light mode UI palettes, and dark mode generates dark mode UI palettes.
      </p>
    </Page>
  )
}
