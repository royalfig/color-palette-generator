import "./css/App.css";
import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Color from "./components/Color";
import Palette from "./components/Palette";
import Panel from "./components/Panel";
import "./css/App.css";
import { generateCss } from "./util";

import ColorSelector from "./components/ColorSelector";

function App() {
  const [color, setColor] = useState("#21a623");
  const [corrected, setCorrected] = useState(false);
  const [selected, setSelected] = useState("hex");

  generateCss(color);

  function handleChange(e) {
    setColor(e.target.value);
  }

  function toggleY(e) {
    setCorrected(e.target.checked);
  }

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
                selected={selected}
                setSelected={setSelected}
              />
            </ColorSelector>

            <Palette
              type="comp"
              corrected={corrected}
              name="Complementary"
              hex={color}
              selected={selected}
            />

            <Palette
              type="adjacent"
              name="Adjacent"
              corrected={corrected}
              selected={selected}
              hex={color}
            />

            <Palette
              type="triad"
              name="Triad"
              corrected={corrected}
              selected={selected}
              hex={color}
            />
            <Palette
              type="tetrad"
              name="Tetrad"
              corrected={corrected}
              selected={selected}
              hex={color}
            />

            <Palette
              type="shades"
              name="Tints &amp; Shades"
              corrected={corrected}
              selected={selected}
              hex={color}
            />

            <Palette
              type="mono"
              name="Monochromatic"
              corrected={corrected}
              selected={selected}
              hex={color}
            />
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
