import "./css/App.css";
import { useState } from "react";
import Header from "./components/Header";
import Palette from "./components/Palette";
import Panel from "./components/Panel";
import "./css/App.css";
import { generateCss } from "./util";
import Sample from "./components/Sample";

import ColorSelector from "./components/ColorSelector";

function App() {
  const [color, setColor] = useState("#21a623");
  const [corrected, setCorrected] = useState(false);
  const [selected, setSelected] = useState("hex");

  generateCss(color);

  function handleChange(e) {
    setColor(e.target.value);
  }

  return (
    <main className="app">
      <section className="left">
        <Header />

        <ColorSelector setColor={handleChange} color={color}>
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
  );
}

export default App;
