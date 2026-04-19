import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'knobs'
const title = 'Knobs'

export function KnobsHeader() {
  return ManualHeader(id, title)
}

export function Knobs() {
  return (
    <Page id={id} title={title}>
      <p>
        The four knobs provide fine-tuned control over color adjustments Each knob applies a unique algorithmic
        transformation to your colors.
      </p>
      <h3>Knob Controls</h3>
      <p>Each knob supports multiple interaction methods:</p>
      <ul>
        <li>
          <strong>Drag:</strong> Click and drag up or down to adjust the value
        </li>
        <li>
          <strong>Mouse wheel:</strong> Scroll over a knob to adjust in increments of 5
        </li>
        <li>
          <strong>Keyboard:</strong> Use arrow keys (left/right) to adjust by 1 when focused
        </li>
        <li>
          <strong>Double-click:</strong> Reset the knob to its default value (0)
        </li>
      </ul>
      <h3>Waveform Types</h3>
      <p>Each knob is labeled with a waveform icon that indicates its adjustment pattern:</p>
      <h4>1. Sawtooth Wave</h4>
      <p>Applies sine wave harmonics to shift hue (±45°) and lightness (±0.15).</p>
      <h4>2. Sine Wave</h4>
      <p>Uses chaotic math to create pseudo-random hue (±120°), lightness (±0.35), and chroma variations.</p>
      <h4>3. Triangle Wave</h4>
      <p>Uses spiral mathematics for controlled hue shifts (±90°) with spiral-based adjustments.</p>
      <h4>4. Square Wave</h4>
      <p>Applies triangular wave functions to create periodic variations across the palette</p>
      <h3>Value Display</h3>
      <p>
        Below each knob, you'll see the current value (000-100) along with the waveform icon. The value represents the
        intensity of the effect being applied.
      </p>
      <p>
        Pro tip: Knobs modify the whole palette, including the base color. Success with them will vary and requires much
        trial and error.
      </p>
    </Page>
  )
}
