import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'export-options'
const title = 'Export Options'

export function ExportOptionsHeader() {
  return ManualHeader(id, title)
}

export function ExportOptions() {
  return (
    <Page id={id} title={title}>
      <p>
        The export options allow you to save and share your color palettes in various formats. Each option is optimized
        for different workflows and use cases.
      </p>

      <h3>1. Image Export</h3>
      <p>
        The <strong>Image</strong> button generates a high-quality PNG image of your palette:
      </p>
      <ul>
        <li>Creates a 1920px wide image with color swatches</li>
        <li>Includes palette name, base color, and timestamp</li>
        <li>Shows color names and values on each swatch</li>
        <li>Automatically adjusts layout for different palette sizes</li>
        <li>UI mode exports show semantic variable names</li>
      </ul>
      <p>Perfect for use in design apps like Figma.</p>

      <h3>2. File Download</h3>
      <p>
        The <strong>File</strong> button downloads your palette as a CSS file:
      </p>
      <ul>
        <li>Generates a .css file with CSS custom properties</li>
        <li>Includes both color values and contrast colors</li>
        <li>In Palette mode: uses sequential naming (--ana-1, --ana-2)</li>
        <li>In UI mode: uses semantic naming (--primary, --on-primary)</li>
      </ul>

      <h3>3. Clipboard Copy</h3>
      <p>
        The <strong>Clipboard</strong> button copies the CSS to your clipboard:
      </p>
      <ul>
        <li>Same format as file download, but copied to clipboard</li>
        <li>Ready to paste directly into your stylesheet</li>
        <li>Shows "Palette copied" confirmation message</li>
        <li>Includes all color values and contrast colors</li>
      </ul>
      <p>Ideal for quick integration into existing projects without downloading files.</p>

      <h3>4. Share Link</h3>
      <p>
        The <strong>Link</strong> button copies a shareable URL:
      </p>
      <ul>
        <li>Captures your current palette configuration in the URL</li>
        <li>Includes base color, palette type, style, and all settings</li>
        <li>Anyone opening the link sees the exact same palette</li>
        <li>Shows "Link copied" confirmation message</li>
      </ul>
      <p>Perfect for collaborating with team members or saving palettes for later.</p>
    </Page>
  )
}
