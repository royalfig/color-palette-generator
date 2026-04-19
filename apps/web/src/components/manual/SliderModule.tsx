import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'slider-module'
const title = 'Slider Module'

export function SliderModuleHeader() {
  return ManualHeader(id, title)
}

export function SliderModule() {
  return (
    <Page id={id} title={title}>
      <p>
        The slider module provides three precision controls for adjusting color properties in your selected color space.
        Each slider dynamically adapts to the current color space, offering appropriate controls for that space's
        parameters.
      </p>

      <p>The three sliders change based on your selected color space.</p>
    </Page>
  )
}
