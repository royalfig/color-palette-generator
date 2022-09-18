import { useState } from "react";

import Color from "./components/Color";
import "./App.css";
import {
  createAdjacent,
  createComplement,
  createTetrad,
  createTriad,
  createMonochromatic,
  createShades,
  generateCss,
} from "./util";

function App() {
  const [color, setColor] = useState("#ff0000");
  const [corrected, setCorrected] = useState(false);
  const complement = createComplement(color);
  const adjacent = createAdjacent(color);
  const triad = createTriad(color);
  const tetrad = createTetrad(color);
  const mono = createMonochromatic(color);
  const shades = createShades(color);
  generateCss(color);
  function handleChange(e) {
    setColor(e.target.value);
  }

  function toggleY(e) {
    setCorrected(e.target.checked);
  }

  return (
    <div className="App">
      <section className="left">
        <header className="header">
          <h1>Color Palette Generator</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda
            accusamus voluptatum et, eius corrupti, vitae iste ut voluptates
            voluptatem, adipisci asperiores culpa. Voluptas molestias totam
            ratione quis, aspernatur voluptatibus magnam.
          </p>
        </header>

        <div className="color-selection">
          <input type="color" onChange={handleChange} value={color}></input>
          <label>
            <input type="checkbox" onChange={toggleY} value={corrected}></input>
            Relative luminance
          </label>
        </div>

        <div className="color-container">
          <h2>Complement</h2>
          <Color color={complement} corrected={corrected} />
        </div>

        <div className="color-container">
          <h2>Adjacent</h2>
          <Color color={adjacent} corrected={corrected} />
        </div>

        <div className="color-container">
          <h2>Triad</h2>
          <Color color={triad} corrected={corrected} />
        </div>

        <div className="color-container">
          <h2>Tetradic</h2>
          <Color color={tetrad} corrected={corrected} />
        </div>

        <div className="color-container">
          <h2>Tones</h2>
          <Color color={mono} corrected={corrected} />
        </div>

        <div className="color-container">
          <h2>Shades & Tints</h2>
          <Color color={shades} corrected={corrected} />
        </div>
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
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Officiis
              minima praesentium, assumenda, quibusdam odio fuga quas explicabo
              aspernatur veritatis quo delectus quae ullam eum deleniti iure
              libero facilis esse velit.
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
    </div>
  );
}

export default App;
