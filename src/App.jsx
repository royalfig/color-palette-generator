import { useCallback, useEffect, useMemo, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { ColorContext } from "./components/ColorContext";
import ColorSelector from "./components/color_selector/ColorSelector";
import LaunchPad from "./components/LaunchPad";
import Palette from "./components/Palette";
import PaletteSelector from "./components/PaletteSelector";
import Navbar from "./components/navbar/Navbar";
import Sample from "./components/samples/Sample";
import "./css/App.css";
import "./css/Defaults.css";
import "./css/Reset.css";
import "./css/Variables.css";

import { debounce } from "lodash-es";
import { ToastContainer } from "react-toastify";
import {
  createAnalogous,
  createBase,
  createComplement,
  createOmbre,
  createPolychroma,
  createSplit,
  createTetradic,
  createTintsAndShades,
  createTones,
  createTriad,
  generateCss,
} from "./util";
import Color from "./components/color_swatch/ColorSwatch";

function getQueryParam() {
  const params = new URLSearchParams(document.location.search);
  if (!params.get("color")) return null;
  return "#" + params.get("color");
}

function App() {
  const [color, setColor] = useState(getQueryParam() || "#21a623");

  const [variation, setVariation] = useState(0);
  const [displayValue, setDisplayValue] = useState("hex");

  const base = useMemo(() => createBase(color));
  const complementaryPalette = useMemo(() => createComplement(color));
  const splitComplementaryPalette = useMemo(() => createSplit(color));
  const analogousPalette = createAnalogous(color);
  const triadicPalette = createTriad(color);
  const tetradicPalette = createTetradic(color);
  const shadesPalette = createTintsAndShades(color);
  const tonalPalette = createTones(color);
  const polychromaPalette = createPolychroma(color);
  const ombrePalette = createOmbre(color);

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

      case "polychroma":
        setPalette(polychromaPalette);
        break;

      case "ombre":
        setPalette(ombrePalette);
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
      poly: polychromaPalette,
      ombre: ombrePalette,
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

  return (
    <div>
      <ColorContext.Provider
        value={{
          color,
          setColor,
          base: { ...base[0] },
          complementaryPalette,
          splitComplementaryPalette,
          analogousPalette,
          tetradicPalette,
          triadicPalette,
          shadesPalette,
          tonalPalette,
          polychromaPalette,
          ombrePalette,
        }}
      >
        <ToastContainer />

        <Navbar></Navbar>

        <main className="app">
          <section className="left">
            {/* <UserInputControls> */}
            <ColorSelector
              setColor={debouncedHandler}
              color={color}
            ></ColorSelector>
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
                polychromaPalette,
                ombrePalette,
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

        <LaunchPad />

        <Sample selectedPalette={palette} />

        {/* TODO UI -> 60/30/10 - green,red,yellow */}

        {/* Surfaces, elements, borders */}

        {/* Tints/shades of all hues */}

        <footer className="footer">
          Designed by <a href="https://ryanfeigenbaum.com">𝕱𝖊𝖎𝖌𝖊𝖓𝖇𝖆𝖚𝖒</a> &copy;{" "}
          {new Date().getFullYear()}
        </footer>
      </ColorContext.Provider>
    </div>
  );
}

export default App;
