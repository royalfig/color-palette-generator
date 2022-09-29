import "../css/Sample.css";
import { useState } from "react";
export default function Sample() {
  const [palette, setPalette] = useState("comp");

  function clickHandler(e) {
    setPalette(e.target.dataset.value);
  }

  return (
    <div>
      <div className="sample-selector">
        <button
          className={palette === "complement" ? "active" : undefined}
          onClick={clickHandler}
          data-value="complement"
        >
          Complement
        </button>
        <button
          className={palette === "adjacent" ? "active" : undefined}
          onClick={clickHandler}
          data-value="adjacent"
        >
          Adjacent
        </button>
        <button
          className={palette === "triad" ? "active" : undefined}
          onClick={clickHandler}
          data-value="triad"
        >
          Triad
        </button>
        <button
          className={palette === "tetrad" ? "active" : undefined}
          onClick={clickHandler}
          data-value="tetrad"
        >
          Tetrad
        </button>
        <button
          className={palette === "tints" ? "active" : undefined}
          onClick={clickHandler}
          data-value="tints"
        >
          Shades
        </button>
        <button
          className={palette === "mono" ? "active" : undefined}
          onClick={clickHandler}
          data-value="mono"
        >
          Mono
        </button>
      </div>
      <div className={`sample ${palette}`}>
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
        <div className="sample-listings">
          <div className="l">
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
          </div>
          <div className="c">
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
          </div>
          <div className="r">
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
            <div className="card">
              <div className="card-image"></div>
              <h3>Test</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
