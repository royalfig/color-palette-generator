import "./css/App.css";
import { useState, useCallback } from "react";
// import Header from "./components/Header";
import Palette from "./components/Palette";
import Panel from "./components/Panel";
import Sample from "./components/sample/Sample";
import Navbar from "./components/Navbar";
import UserInputControls from "./components/UserInputControls";
import ColorSelector from "./components/ColorSelector";
import PaletteSelector from "./components/PaletteSelector";
import Options from "./components/Options";

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
import { Toaster } from "react-hot-toast";
import { debounce, size } from "lodash-es";
import { useEffect } from "react";

function getQueryParam() {
  const params = new URLSearchParams(document.location.search);
  if (!params.get("color")) return null;
  return "#" + params.get("color");
}

function App() {
  const [color, setColor] = useState(getQueryParam() || "#21a623");
  const [corrected, setCorrected] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleDarkMode = () => {
    setDarkMode((val) => !val);
  };

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
      {/* <Header /> */}
      <Navbar
        setDarkMode={handleDarkMode}
        darkMode={darkMode}
        css={css}
      ></Navbar>

      <main className="app">
        <section className="left">
          <UserInputControls>
            <ColorSelector
              setColor={debouncedHandler}
              color={color}
            ></ColorSelector>

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
          </UserInputControls>

          <Options />

          <Palette palette={palette} />
        </section>
        <section className="right">
          <Sample />
        </section>
      </main>
    </div>
  );
}

export default App;
