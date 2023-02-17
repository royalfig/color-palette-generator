import { useState, useCallback, useEffect } from "react";
import "./css/Reset.css";
import "./css/Variables.css";
import "./css/Defaults.css";
import "./css/App.css";
import "react-toastify/dist/ReactToastify.css";
import Palette from "./components/Palette";
import Sample from "./components/Sample";
import Navbar from "./components/Navbar";
import ColorSelector from "./components/ColorSelector";
import PaletteSelector from "./components/PaletteSelector";

import {
  createAdjacent,
  createComplement,
  createMonochromatic,
  createShades,
  createSplit,
  createTetrad,
  createTriad,
  generateCss,
} from "./util";
import { debounce } from "lodash-es";
import { ToastContainer } from "react-toastify";

function getQueryParam() {
  const params = new URLSearchParams(document.location.search);
  if (!params.get("color")) return null;
  return "#" + params.get("color");
}

function App() {
  const [color, setColor] = useState(getQueryParam() || "#21a623");
  const [corrected, setCorrected] = useState(false); // TODO Delete
  const [luminance, setLuminance] = useState("absolute");
  const [displayValue, setDisplayValue] = useState("hex");

  const complementaryPalette = createComplement(color);
  const splitComplementaryPalette = createSplit(color);
  const analogousPalette = createAdjacent(color);
  const triadicPalette = createTriad(color);
  const tetradicPalette = createTetrad(color);
  const shadesPalette = createShades(color);
  const monochramaticPalette = createMonochromatic(color);

  const [palette, setPalette] = useState(complementaryPalette);

  function handlePalette(e) {
    const name = e?.currentTarget?.dataset?.name || e;
    switch (name) {
      case "Complementary":
        setPalette(complementaryPalette);
        break;

      case "Split Complementary":
        setPalette(splitComplementaryPalette);
        break;

      case "Analogous":
        setPalette(analogousPalette);
        break;

      case "Triadic":
        setPalette(triadicPalette);
        break;

      case "Tetradic":
        setPalette(tetradicPalette);
        break;

      case "Shades":
        setPalette(shadesPalette);
        break;

      case "Monochromatic":
        setPalette(monochramaticPalette);
        break;
    }
  }

  useEffect(() => {
    handlePalette(palette[0].name);
  }, [color]);

  const css = generateCss(color);

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
    <div className={corrected ? "corrected" : undefined}>
      <ToastContainer />

      <Navbar css={css}></Navbar>

      <main className="app">
        <section className="left">
          {/* <UserInputControls> */}
          <ColorSelector
            setColor={debouncedHandler}
            color={color}
          ></ColorSelector>
          <div className="idea">💡Copy most values by clicking on it</div>
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
            luminance={luminance}
            displayValue={displayValue}
            setDisplayValue={setDisplayValue}
          />
        </section>
      </main>
      <Sample selectedPalette={palette} />
    </div>
  );
}

export default App;
