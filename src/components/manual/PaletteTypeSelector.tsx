import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'palette-type-selector'
const title = 'Palette Type Selector'

export function PaletteTypeSelectorHeader() {
  return ManualHeader(id, title)
}

export function PaletteTypeSelector() {
  return (
    <Page id={id} title={title}>
      <p>
        The palette type selector determines the color relationships in your generated palette. Each type uses different
        color theory principles to create harmonious or contrasting color combinations.
      </p>

      <h3>Palette Types</h3>

      <ul>
        <li>
          <strong>Analogous (ANA)</strong>: Creates harmonious palettes using colors adjacent on the color wheel.
          Generates 6 colors with subtle hue variations, perfect for cohesive, calming designs.
        </li>
        <li>
          <strong>Complementary (COM)</strong>: Uses colors from opposite sides of the color wheel for maximum contrast.
          Creates dynamic palettes with natural tension and visual impact.
        </li>
        <li>
          <strong>Split Complementary (SPL)</strong>: Combines one base color with two colors adjacent to its
          complement. Offers high contrast while being less jarring than pure complementary schemes.
        </li>
        <li>
          <strong>Triadic (TRI)</strong>: Uses three colors evenly spaced around the color wheel (~120° apart). Creates
          vibrant, balanced palettes while maintaining harmony.
        </li>
        <li>
          <strong>Tetradic (TET)</strong>: Uses four colors arranged in two complementary pairs. Offers the most color
          variety while requiring careful balance in application.
        </li>
        <li>
          <strong>Tints & Shades (TAS)</strong>: Creates a monochromatic palette with 12 variations of your base color,
          ranging from very dark shades to very light tints. Perfect for creating depth and hierarchy.
        </li>
      </ul>

      <h3>How Palette Types Work</h3>
      <p>
        Each palette type follows specific mathematical and perceptual rules to generate colors. The actual colors
        produced depend on:
      </p>
      <ul>
        <li>Your chosen base color</li>
        <li>The selected palette style (Square, Triangle, Circle, Diamond)</li>
        <li>Any adjustments made with sliders and knobs</li>w
      </ul>
    </Page>
  )
}
