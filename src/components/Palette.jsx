import { useState, useEffect } from "react";
import Color from "./Color";
import Controls from "./Controls";
import {
  createAdjacent,
  createComplement,
  createTetrad,
  createTriad,
  createMonochromatic,
  createShades,
  hex3to6,
} from "../util";

export default function Palette({ type, hex, corrected, name }) {
  const [names, setNames] = useState([]);
  const [palette, setPalette] = useState("");
  const colors = createColorPalette(type, hex);

  function createColorPalette(type, color) {
    switch (type) {
      case "comp":
        return createComplement(color);
        break;
      case "adjacent":
        return createAdjacent(color);
        break;
      case "tetrad":
        return createTetrad(color);
        break;
      case "triad":
        return createTriad(color);
        break;
      case "mono":
        return createMonochromatic(color);
        break;
      case "shades":
        return createShades(color);
        break;
    }
  }

  const colorNames = colors.map((color) => hex3to6(color.hex)).join();
  const correctedColorNames = colors
    .map((color) => hex3to6(color.corrected.hex))
    .join();

  useEffect(() => {
    async function getColorName() {
      const res = await fetch(
        `https://api.color.pizza/v1/${colorNames},${correctedColorNames}`
      );
      const names = await res.json();

      setNames(names.colors);
      setPalette(names.paletteTitle);
    }

    getColorName();
  }, [hex]);

  const [selected, setSelected] = useState("hex");

  return (
    <div className="palette">
      <header>
        <h2>{name}</h2>
      </header>
      <Color
        corrected={corrected}
        color={colors}
        selected={selected}
        names={names}
      />
      <Controls
        setSelected={setSelected}
        selected={selected}
        palette={palette}
      />
    </div>
  );
}
