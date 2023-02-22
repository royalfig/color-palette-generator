import { useCallback, useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import ColorSelector from "./components/ColorSelector";
import Navbar from "./components/Navbar";
import Palette from "./components/Palette";
import PaletteSelector from "./components/PaletteSelector";
import Sample from "./components/Sample";
import "./css/App.css";
import "./css/Defaults.css";
import "./css/Reset.css";
import "./css/Variables.css";

import { debounce } from "lodash-es";
import { ToastContainer } from "react-toastify";
import {
  createAnalogous,
  createComplement,
  createTintsAndShades,
  createSplit,
  createTetradic,
  createTones,
  createTriad,
  generateCss,
} from "./util";

function getQueryParam() {
  const params = new URLSearchParams(document.location.search);
  if (!params.get("color")) return null;
  return "#" + params.get("color");
}

function App() {
  const [color, setColor] = useState(getQueryParam() || "#21a623");
  const [variation, setVariation] = useState(0);

  const [displayValue, setDisplayValue] = useState("hex");

  const complementaryPalette = createComplement(color);
  const splitComplementaryPalette = createSplit(color);
  const analogousPalette = createAnalogous(color);
  const triadicPalette = createTriad(color);
  const tetradicPalette = createTetradic(color);
  const shadesPalette = createTintsAndShades(color);
  const monochramaticPalette = createTones(color);

  const [palette, setPalette] = useState(complementaryPalette);

  function handlePalette(e) {
    const name = e?.currentTarget?.dataset?.name || e;
    switch (name) {
      case "complementary":
        setPalette(complementaryPalette);
        break;

      case "split complementary":
        setPalette(splitComplementaryPalette);
        break;

      case "analogous":
        setPalette(analogousPalette);
        break;

      case "triadic":
        setPalette(triadicPalette);
        break;

      case "tetradic":
        setPalette(tetradicPalette);
        break;

      case "tints and shades":
        setPalette(shadesPalette);
        break;

      case "tones":
        setPalette(monochramaticPalette);
        break;
    }
  }

  useEffect(() => {
    handlePalette(palette.name);
    generateCss(color);
  }, [color]);

  const debouncedHandler = useCallback(
    debounce((e) => {
      return handleChange(e);
    }, 100),
    []
  );

  useEffect(() => {
    window.onpopstate = () => {
      const params = new URLSearchParams(document.location.search);
      if (!params.get("color")) return;
      setColor("#" + params.get("color"));
    };
  });

  function handleChange(e) {
    const url = new URL(window.location);
    url.searchParams.set("color", e.substring(1));
    window.history.pushState({}, "", url);
    setColor(e);
  }

  return (
    <div>
      <ToastContainer />

      <Navbar></Navbar>

      <main className="app">
        <section className="left">
          {/* <UserInputControls> */}
          <ColorSelector
            setColor={debouncedHandler}
            color={color}
          ></ColorSelector>
          <div className="palette-container">
            💡Copy most values with a click
          </div>
        </section>

        <section className="right">
          <PaletteSelector
            palettes={[
              complementaryPalette,
              splitComplementaryPalette,
              analogousPalette,
              tetradicPalette,
              triadicPalette,
              shadesPalette,
              monochramaticPalette,
            ]}
            handlePalette={handlePalette}
            palette={palette}
          ></PaletteSelector>

          <Palette
            palette={palette}
            displayValue={displayValue}
            setDisplayValue={setDisplayValue}
            variation={variation}
            setVariation={setVariation}
          />
        </section>
      </main>
      <Sample selectedPalette={palette} />
    </div>
  );
}

export default App;
