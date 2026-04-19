import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'display-info-panel'
const title = 'Display Information Panel'

export function DisplayInfoPanelHeader() {
  return ManualHeader(id, title)
}

export function DisplayInfoPanel() {
  return (
    <Page id={id} title={title}>
      <p>
        The display information panel appears at the bottom of the color display area. It provides real-time information
        about your monitor's color capabilities and system messages.
      </p>
      <h3>Display Capabilities</h3>
      <p>When no system messages are shown, the panel displays three key pieces of information about your monitor:</p>
      <h4>1. Color Gamut</h4>
      <p>
        Shows which color space your display supports: <strong>sRGB</strong>, <strong>P3</strong>, or{' '}
        <strong>Rec2020</strong>. This indicates the range of colors your monitor can physically display.
      </p>
      <ul>
        <li>
          <strong>sRGB:</strong> The standard color space used by most monitors and the web
        </li>
        <li>
          <strong>P3:</strong> A wider gamut used by newer displays, covering more saturated colors
        </li>
        <li>
          <strong>Rec2020:</strong> An even wider gamut used by professional displays
        </li>
      </ul>
      <h4>2. Human Vision Coverage</h4>
      <p>Displays the percentage of colors visible to the human eye that your monitor can reproduce:</p>
      <ul>
        <li>
          <strong>sRGB:</strong> ~35% coverage
        </li>
        <li>
          <strong>P3:</strong> ~45% coverage
        </li>
        <li>
          <strong>Rec2020:</strong> ~63% coverage
        </li>
      </ul>
      <p>Fuck yeah, human eye, let's go.</p>
      <p>
        This helps you understand the color reproduction limitations of your display. Colors outside your display's
        gamut will be clipped to the nearest displayable color.
      </p>
      <h4>3. Dynamic Range</h4>
      <p>Indicates whether your display supports:</p>
      <ul>
        <li>
          <strong>SDR (Standard Dynamic Range):</strong> Traditional displays with standard brightness levels
        </li>
        <li>
          <strong>HDR (High Dynamic Range):</strong> Displays capable of showing brighter highlights and deeper shadows
        </li>
      </ul>
      <h3>System Messages</h3>
      <p>The panel also displays temporary system messages with different icons and colors to indicate:</p>
      <ul>
        <li>
          <strong>Success messages:</strong> Green with a checkmark (e.g., "Palette copied", "Downloaded")
        </li>
        <li>
          <strong>Error messages:</strong> Red with an X icon
        </li>
        <li>
          <strong>Info messages:</strong> Blue with an info icon
        </li>
      </ul>
      <p>These messages appear briefly to confirm actions or alert you to issues.</p>
    </Page>
  )
}
