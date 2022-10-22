import "./css/App.css";
import { useState, useCallback } from "react";
// import Header from "./components/Header";
import Palette from "./components/Palette";
import Panel from "./components/Panel";

import { generateCss } from "./util";
import Sample from "./components/sample/Sample";
import { Toaster } from "react-hot-toast";
import ColorSelector from "./components/ColorSelector";
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
  const [selected, setSelected] = useState("hex");

  generateCss(color);

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

      <Toaster
        toastOptions={{
          position: "top-right",
          style: {
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--mono-10)",
            color: "var(--mono-1)",
            borderRadius: 0,
            padding: "var(--button-padding)",
            fontSize: "var(--small)",
            boxShadow:
              "2.8px 2.8px 2.2px rgba(0, 0, 0, 0.02),6.7px 6.7px 5.3px rgba(0, 0, 0, 0.028),12.5px 12.5px 10px rgba(0, 0, 0, 0.035),22.3px 22.3px 17.9px rgba(0, 0, 0, 0.042),41.8px 41.8px 33.4px rgba(0, 0, 0, 0.05),100px 100px 80px rgba(0, 0, 0, 0.07)",
          },
        }}
      />
      <main className="app">
        <section className="left">
          <ColorSelector
            setColor={debouncedHandler}
            color={color}
            selected={selected}
          >
            <Panel
              setCorrected={setCorrected}
              corrected={corrected}
              color={color}
              selected={selected}
              setSelected={setSelected}
            />
          </ColorSelector>

          <Palette
            type="comp"
            corrected={corrected}
            name="Complementary"
            hex={color}
            selected={selected}
          />

          <Palette
            type="split"
            corrected={corrected}
            name="Split Complementary"
            hex={color}
            selected={selected}
          />

          <Palette
            type="adjacent"
            name="Adjacent"
            corrected={corrected}
            selected={selected}
            hex={color}
          />

          <Palette
            type="triad"
            name="Triadic"
            corrected={corrected}
            selected={selected}
            hex={color}
          />
          <Palette
            type="tetrad"
            name="Tetradic"
            corrected={corrected}
            selected={selected}
            hex={color}
          />
        </section>
        <section className="right">
          <Sample />
          <Palette
            type="shades"
            name="Tints &amp; Shades"
            corrected={corrected}
            selected={selected}
            hex={color}
          />

          <Palette
            type="mono"
            name="Monochromatic"
            corrected={corrected}
            selected={selected}
            hex={color}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
