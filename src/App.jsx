import "./css/App.css";
import { useState, useCallback } from "react";
import Palette from "./components/Palette";
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
import {
  Eye,
  Lightbulb,
  Clipboard,
  Image,
  BracesAsterisk,
} from "react-bootstrap-icons";

function getQueryParam() {
  const params = new URLSearchParams(document.location.search);
  if (!params.get("color")) return null;
  return "#" + params.get("color");
}

function App() {
  const [color, setColor] = useState(getQueryParam() || "#21a623");
  const [corrected, setCorrected] = useState(false); // TODO Delete
  const [darkMode, setDarkMode] = useState(false);
  const [luminance, setLuminance] = useState("absolute");
  const [displayValue, setDisplayValue] = useState("hex");

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

            <Options
              setDisplayValue={setDisplayValue}
              displayValue={displayValue}
            />

            <div className="luminance-container">
              <div className="luminance-header">
                <h2>Luminance</h2>
                <div className="gradients">
                  <div className="gradient"></div>
                  <div className="gradient"></div>
                  <div className="gradient"></div>
                </div>
              </div>
              <p>Luminance measures the brightness of a color.</p>

              <div className="flex">
                <button
                  onClick={() => setLuminance("absolute")}
                  className={
                    luminance === "absolute"
                      ? "icon-text-button active"
                      : "icon-text-button"
                  }
                >
                  <Lightbulb /> Absolute
                </button>
                <button
                  onClick={() => setLuminance("relative")}
                  className={
                    luminance === "relative"
                      ? "icon-text-button active"
                      : "icon-text-button"
                  }
                >
                  <Eye />
                  Relative
                </button>
              </div>
            </div>

            <div className="preferences-container">
              <header className="preferences">
                <h2>Export</h2>
                <div className="gradients">
                  <div className="gradient"></div>
                  <div className="gradient"></div>
                  <div className="gradient"></div>
                </div>
              </header>
              <div className="preferences">
                <button className="icon-text-button">
                  <Clipboard /> <span>Copy CSS</span>
                </button>
                <button className="icon-text-button">
                  <BracesAsterisk /> <span>Download CSS</span>
                </button>
                <button className="icon-text-button">
                  <Image /> <span>Image</span>
                </button>
              </div>
            </div>
          </UserInputControls>
        </section>
        <section className="right">
          <Palette
            palette={palette}
            luminance={luminance}
            displayValue={displayValue}
          />
          <Sample selectedPalette={palette} />
        </section>
      </main>
    </div>
  );
}

export default App;
