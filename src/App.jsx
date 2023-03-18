import { useCallback, useEffect, useMemo, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import ColorSelector from "./components/ColorSelector";
import Navbar from "./components/Navbar";
import Palette from "./components/Palette";
import PaletteSelector from "./components/PaletteSelector";
import Sample from "./components/samples/Sample";
import LaunchPad from "./components/LaunchPad";
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
import { sayings } from "./util/ArticleData";

function getQueryParam() {
  const params = new URLSearchParams(document.location.search);
  if (!params.get("color")) return null;
  return "#" + params.get("color");
}

function App() {
  const [color, setColor] = useState(getQueryParam() || "#21a623");
  const [variation, setVariation] = useState(0);
  const [displayValue, setDisplayValue] = useState("hex");

  const complementaryPalette = useMemo(() => createComplement(color), [color]);
  const splitComplementaryPalette = useMemo(() => createSplit(color), [color]);
  const analogousPalette = createAnalogous(color);
  const triadicPalette = createTriad(color);
  const tetradicPalette = createTetradic(color);
  const shadesPalette = createTintsAndShades(color);
  const tonalPalette = createTones(color);

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
        setPalette(tonalPalette);
        break;
    }
  }

  useEffect(() => {
    handlePalette(palette.name);
    generateCss(color, {
      complement: complementaryPalette,
      analogous: analogousPalette,
      tetrad: tetradicPalette,
      triad: triadicPalette,
      split: splitComplementaryPalette,
      tones: tonalPalette,
      shades: shadesPalette,
    });
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

  useEffect(() => {
    const int = setInterval(() => {
      setSaying(sayings[Math.floor(Math.random() * sayings.length)]);
    }, 10000);
    return () => clearInterval(int);
  });

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
            <LaunchPad />
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
              tonalPalette,
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

      <footer className="footer">
        Designed by 𝕱𝖊𝖎𝖌𝖊𝖓𝖇𝖆𝖚𝖒 &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
