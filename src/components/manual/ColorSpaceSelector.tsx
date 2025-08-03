import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'color-space-selector'
const title = 'Color Space Selector'

export function ColorSpaceSelectorHeader() {
  return ManualHeader(id, title)
}

export function ColorSpaceSelector() {
  return (
    <Page id={id} title={title}>
      <p>
        Choose your preferred color space with the color space selector. "Color space selector" is a bit of a misnomer
        as it's really a color space/format selector. But that doesn't roll off the tongue as easily.
      </p>
      <p>Options include:</p>
      <ul style={{ listStyle: 'none' }}>
        <li>
          <strong>OKLCH</strong>: Lightness, Chroma, Hue. The default color space for the Color Palette Pro. A modern
          perceptually uniform color space that improves upon LCH by providing more accurate color perception across the
          entire gamut. OKLCH ensures that equal numerical changes result in equal perceived changes, making it ideal
          for creating harmonious color palettes. The hue component remains consistent across different lightness
          levels, preventing hue shifts common in other color spaces.
        </li>
        <li>
          <strong>LCH</strong>: Lightness, Chroma, Hue. A cylindrical representation of the LAB color space. While more
          perceptually uniform than HSL, it can produce hue shifts at extreme chroma values and has some inconsistencies
          in blue regions. LCH makes it easier to create color variations by adjusting lightness and chroma while
          maintaining the same perceived hue.
        </li>
        <li>
          <strong>OKLAB</strong>: Lightness, A (Green/Red), B (Blue/Yellow). A perceptually uniform color space that
          corrects the numerical irregularities found in LAB. Designed for image processing and color manipulation,
          OKLAB provides smooth gradients and predictable color mixing. The A and B axes represent opponent color
          channels, making it excellent for color difference calculations.
        </li>
        <li>
          <strong>LAB</strong>: Lightness, A (Green/Red), B (Blue/Yellow). Based on human color perception, LAB
          separates lightness from color information. While revolutionary for its time, it has some non-uniformities,
          particularly in blue regions. The color opponent axes (A and B) approximate how our eyes process color
          information.
        </li>
        <li>
          <strong>P3</strong>: Display P3 is a wide-gamut color space developed by Apple that can represent
          approximately 25% more colors than sRGB. It's becoming the standard for modern displays and is particularly
          important for vibrant greens and reds. Values are typically expressed as RGB triplets but cover a
          significantly larger range of visible colors.
        </li>
        <li>
          <strong>HSL</strong>: Hue (0-360°), Saturation (0-100%), Lightness (0-100%). An intuitive cylindrical color
          model that's easy for humans to understand and manipulate. However, it's not perceptually uniform—colors with
          the same lightness value can appear drastically different in perceived brightness. Despite this limitation, it
          remains popular for color selection interfaces.
        </li>
        <li>
          <strong>RGB</strong>: Red (0-255), Green (0-255), Blue (0-255). The additive color model used by displays,
          based on how screens emit light. While directly tied to hardware, RGB is not intuitive for color selection or
          manipulation. Values are typically specified in the sRGB color space, which covers about 35% of visible
          colors.
        </li>
        <li>
          <strong>HEX</strong>: Hexadecimal notation for RGB values (#RRGGBB). A compact way to represent sRGB colors
          using base-16 notation. While ubiquitous in web development, HEX values are difficult to read and manipulate
          without conversion. Each pair of characters represents the red, green, and blue components respectively
          (00-FF).
        </li>
      </ul>
    </Page>
  )
}
