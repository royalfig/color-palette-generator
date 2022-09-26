import "./css/App.css";
import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Color from "./components/Color";
import Palette from "./components/Palette";
import Panel from "./components/Panel";
import "./css/App.css";

import {
  createAdjacent,
  createComplement,
  createTetrad,
  createTriad,
  createMonochromatic,
  createShades,
  generateCss,
} from "./util";
import ColorSelector from "./components/ColorSelector";

function App() {
  const [color, setColor] = useState("#ff0000");
  const [corrected, setCorrected] = useState(false);

  const complement = createComplement(color);
  const analogous = createAdjacent(color);
  const triad = createTriad(color);
  const tetrad = createTetrad(color);
  const mono = createMonochromatic(color);
  const shades = createShades(color);

  generateCss(color);

  function handleChange(e) {
    console.log("running parents");
    setColor(e.target.value);
  }

  function toggleY(e) {
    setCorrected(e.target.checked);
  }

  const [palette, setPalette] = useState("complement");

  const paletteSelect = (e) => {
    setPalette(e.target.value);
  };

  const [selected, setSelected] = useState("hex");

  const handleSelect = (e) => {
    setSelected(e.target.value);
  };

  return (
    <div className="container">
      <div className="inner-container">
        <main className="app">
          <section className="left">
            <Header />

            <ColorSelector setColor={handleChange} color={color}>
              <Panel
                setCorrected={toggleY}
                corrected={corrected}
                color={color}
              />
            </ColorSelector>

            <Palette palette={complement} name="Complementary">
              <Color
                color={complement}
                corrected={corrected}
                selected={selected}
              />
              <div className="controls">
                <select
                  name="pets"
                  id="pet-select"
                  value={selected}
                  onChange={handleSelect}
                >
                  <option value="name">Name</option>
                  <option value="hex">Hex</option>
                  <option value="rgb">Rgb</option>
                  <option value="hsl">Hsl</option>
                  <option value="lch">Lch</option>
                  <option value="contrast">Contrast</option>
                  <option value="y">Luminance</option>
                </select>
              </div>
            </Palette>

            <Palette palette={analogous} name="Analogous">
              <Color color={analogous} corrected={corrected} />
            </Palette>

            <Palette palette={triad} name="Triad">
              <Color color={triad} corrected={corrected} />
            </Palette>

            <Palette palette={tetrad} name="Tetrad">
              <Color color={tetrad} corrected={corrected} />
            </Palette>

            <Palette palette={mono} name="Monochrome">
              <Color color={mono} corrected={corrected} />
            </Palette>

            <Palette palette={shades} name="Shades & Tints">
              <Color color={shades} corrected={corrected} />
            </Palette>
          </section>
          <section className="right">
            <div className="sample">
              <div className="sample-navbar">
                <div>
                  <ul>
                    <li>
                      <a href="#">Test</a>
                    </li>
                    <li>
                      <a href="#">Test</a>
                    </li>
                    <li>
                      <a href="#">Test</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="sample-header">
                <h2>Color Palette Generator</h2>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Officiis minima praesentium, assumenda, quibusdam odio fuga
                  quas explicabo aspernatur veritatis quo delectus quae ullam
                  eum deleniti iure libero facilis esse velit.
                </p>
                <a href="#" className="sample-cta">
                  Read the article
                </a>
              </div>
              <div className="sample-body">
                <article className="sample-article">
                  <div className="sample-image"></div>
                  <h3>Sample text</h3>
                </article>
                <article className="sample-article">
                  <div className="sample-image"></div>
                  <h3>Sample text</h3>
                </article>
                <article className="sample-article">
                  <div className="sample-image"></div>
                  <h3>Sample text</h3>
                </article>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
