import './manual.css'

export default function Manual() {
  return (
    <div className="manual-container">
      <section className="manual-section">
        <h1>Color Palette Pro</h1>

        <div className="divider"></div>

        <p>
          Congratulations on your purchase of the Color Palette Pro, the premium version of the Color Palette Tool.
          You're well on your way to creating the kind of color palettes your parents warned you about.
        </p>
      </section>

      <section className="manual-section">
        <h2>Table of Contents</h2>
        <ol>
          <li>
            <a href="#introduction">Introduction</a>
          </li>
          <li>
            <a href="#color-space-selector">Color Space Selector</a>
          </li>
          <li>
            <a href="#palette-style-selector">Palette Style Selector</a>
          </li>
          <li>
            <a href="#palette-tool-selector">Palette Tool Selector</a>
          </li>
          <li>
            <a href="#palette-type-selector">Palette Type Selector</a>
          </li>
          <li>
            <a href="#the-display">The Display</a>
          </li>
          <li>
            <a href="#the-input-color-container">The Input Color Container</a>
          </li>
          <li>
            <a href="#the-palette-display">The Palette Display</a>
          </li>
        </ol>
      </section>

      <section id="introduction" className="manual-section">
        <h2>Introduction</h2>
        <p>
          The Color Palette Pro is a tool for creating, ah, yes, color palettes. And while it's a tool for that,
          creating color palettes programmatically is damn near impossible. They say taste is reserved for the gods, and
          you ain't a god.
        </p>
        <p>That's all to say, YMMV with this tool, and it can't be held responsible for your poor-ass taste.</p>
      </section>

      <section className="manual-section">
        <h2 id="color-space-selector">Color Space Selector</h2>
        <p>
          The Color Space selector is poorly named. It should really be called the color format selector, but that
          doesn't have the same ring to it.
        </p>
        <p>These buttons allows you to change how the color is displayed.</p>
        <ul>
          <li>
            OKLCH: The default color space. It's a color space that is designed to be perceptually uniform, meaning that
            the colors are evenly spaced in terms of how they are perceived by the human eye. It makes up for the
            shortcomings of its brother, LCH.
          </li>
          <li>LCH: Lightness, Chroma, Hue. A perceptually uniform color space that is designed to be easy to use.</li>
          <li>
            OKLAB: A color space that is designed to be perceptually uniform, meaning that the colors are evenly spaced
          </li>
          <li>
            LAB: Lightness, a, b. A color space that is designed to be perceptually uniform, meaning that the colors are
            evenly spaced in terms of how they are perceived by the human eye.
          </li>
          <li>P3:</li>
          <li>HSL: Hue, Saturation, Lightness. Widely supported, but not perceptually uniform.</li>
          <li>
            RGB: Red, Green, Blue. It operates in the sRGB color space, which is a standard color space for digital
            displays. It can only represent a subset of the colors that can be represented in the other color spaces.
          </li>
          <li>HEX: Hexadecimal. Also sRGB color space. It's widely supported, but not intuitive or easy to use.</li>
        </ul>
      </section>

      <section className="manual-section">
        <h2 id="palette-style-selector">Palette Style Selector</h2>
        <p>XYZ</p>
      </section>

      <section className="manual-section">
        <h2 id="palette-tool-selector">Palette Tool Selector</h2>
        <p>XYZ</p>
      </section>

      <section className="manual-section">
        <h2 id="palette-type-selector">Palette Type Selector</h2>
        <p>XYZ</p>
      </section>

      <section className="manual-section">
        <h2 id="the-display">The Display</h2>
        <p>XYZ</p>
      </section>

      <section className="manual-section">
        <h2 id="the-input-color-container">The Input Color Container</h2>
        <p>XYZ</p>
      </section>

      <section className="manual-section">
        <h2 id="the-palette-display">The Palette Display</h2>
        <p>XYZ</p>
      </section>
    </div>
  )
}
