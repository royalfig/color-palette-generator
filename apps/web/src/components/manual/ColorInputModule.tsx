import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'color-input-module'
const title = 'Color Input Module'

export function ColorInputModuleHeader() {
  return ManualHeader(id, title)
}

export function ColorInputModule() {
  return (
    <Page id={id} title={title}>
      <p>
        The color input module is your primary way to set a base color for palette generation. It accepts colors in
        virtually any format and includes an eyedropper tool for sampling colors from your screen.
      </p>

      <h3>Input Methods</h3>

      <h4>1. Eyedropper Tool</h4>
      <p>Click the eyedropper icon to sample any color from your screen:</p>
      <ul>
        <li>Works on supported browsers (Chrome, Edge, Opera)</li>
        <li>Automatically converts sampled colors to sRGB/Hex format</li>
        <li>Updates the color space selector to RGB when used</li>
        <li>Perfect for matching existing colors from designs or websites</li>
      </ul>

      <h4>2. Text Input Field</h4>
      <p>Type or paste color values in any supported format:</p>
      <ul>
        <li>
          <strong>Hex:</strong> #FF5733, #F57, FF5733 (with or without #)
        </li>
        <li>
          <strong>RGB:</strong> rgb(255, 87, 51), rgb(100% 34% 20%)
        </li>
        <li>
          <strong>HSL:</strong> hsl(9, 100%, 60%), hsl(9deg 100% 60%)
        </li>
        <li>
          <strong>LAB:</strong> lab(64 45 47), lab(64% 45 47)
        </li>
        <li>
          <strong>LCH:</strong> lch(64 65 46), lch(64% 65 46)
        </li>
        <li>
          <strong>OKLAB:</strong> oklab(0.7 0.12 0.11), oklab(70% 0.12 0.11)
        </li>
        <li>
          <strong>OKLCH:</strong> oklch(0.7 0.16 42), oklch(70% 0.16 42)
        </li>
        <li>
          <strong>Named colors:</strong> red, blue, tomato, etc.
        </li>
      </ul>

      <h3>The Play Button</h3>
      <p>Click the Play button or press Enter to:</p>
      <ul>
        <li>Parse and validate your color input</li>
        <li>Generate a new palette based on the color</li>
        <li>Update all displays and controls</li>
        <li>Add the color to your history</li>
      </ul>
    </Page>
  )
}
