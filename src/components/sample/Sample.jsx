import "../../css/Sample.css";
import { useState } from "react";
import SampleDescription from "./SampleDescription";
import zero from "../../assets/0.jpg";
import one from "../../assets/1.jpg";
import two from "../../assets/2.jpg";

const titleText = {
  complement: "The dynamic duo",
  adjacent: "Thick as thieves",
  triad: "Did someone say thruple?",
  tetrad: "Four play",
  tints: "One color's all it takes",
  mono: "It's classy",
  split: "Splitsville.",
};

export default function Sample() {
  const [palette, setPalette] = useState("complement");

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
          className={palette === "split" ? "active" : undefined}
          onClick={clickHandler}
          data-value="split"
        >
          Split
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
          <p className="sample-title"></p>
          <div>
            <ul>
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Resources</a>
              </li>
              <li>
                <a href="#">Github</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="sample-header">
          <h2>{titleText[palette]}</h2>
          <SampleDescription palette={palette} />
          <a href="#" className="sample-cta">
            Give me some green
          </a>
        </div>
        <div className="sample-body">
          <article className="sample-article">
            <div className="sample-image">
              <img src={zero} alt="" />
            </div>
            <h3>
              <a href="https://lea.verou.me/2022/06/releasing-colorjs/">
                A library that takes color seriously
              </a>
            </h3>
          </article>
          <article className="sample-article">
            <div className="sample-image">
              <img src={one} alt="" />
            </div>
            <h3>Sample text</h3>
          </article>
          <article className="sample-article">
            <div className="sample-image">
              <img src={two} alt="" />
            </div>
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
