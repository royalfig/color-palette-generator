import "../../css/Sample.css";
import { useState } from "react";
import SampleDisplay from "./SampleDisplay";

const titleText = {
  complement: { description: "It takes two", name: "Complementary" },
  adjacent: { description: "Thick as thieves", name: "Adjacent" },
  triad: { description: "Did someone say thruple?", name: "Triadic" },
  tetrad: { description: "Four play", name: "Tetradic" },
  tints: { description: "One color's all it takes", name: "Tints & Shades" },
  mono: { description: "It's classy", name: "Monochromatic" },
  split: { description: "Splitsville.", name: "Split Complementary" },
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

      <SampleDisplay selectedPalette={palette} />
    </div>
  );
}
