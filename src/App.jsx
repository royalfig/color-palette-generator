import "./css/App.css";
import { useState, useCallback } from "react";
import Header from "./components/Header";
import Palette from "./components/Palette";
import Panel from "./components/Panel";
import "./css/App.css";
import { generateCss } from "./util";
import Sample from "./components/Sample";
import { Toaster } from "react-hot-toast";
import ColorSelector from "./components/ColorSelector";
import { debounce } from "lodash-es";

function App() {
  const [color, setColor] = useState("#21a623");
  const [corrected, setCorrected] = useState(false);
  const [selected, setSelected] = useState("hex");

  generateCss(color);

  const debouncedHandler = useCallback(
    debounce((e) => {
      return handleChange(e);
    }, 500),
    []
  );

  function handleChange(e) {
    setColor(e);
  }

  return (
    <div className={corrected ? "corrected" : undefined}>
      <Header />

      <Toaster
        toastOptions={{
          style: {
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--shades-10)",
            color: "var(--shades-1)",
            borderRadius: 0,
            padding: "var(--button-padding)",
          },
        }}
      />
      <main className="app">
        <section className="left">
          <ColorSelector setColor={debouncedHandler} color={color}>
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
            type="adjacent"
            name="Adjacent"
            corrected={corrected}
            selected={selected}
            hex={color}
          />

          <Palette
            type="triad"
            name="Triad"
            corrected={corrected}
            selected={selected}
            hex={color}
          />
          <Palette
            type="tetrad"
            name="Tetrad"
            corrected={corrected}
            selected={selected}
            hex={color}
          />

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
        <section className="right">
          <Sample />
        </section>
      </main>
    </div>
  );
}

export default App;
