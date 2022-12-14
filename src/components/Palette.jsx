import { useState, useEffect } from "react";
import Color from "./Color";
import Controls from "./Controls";
import Circle from "./Circle";
import {
  createAdjacent,
  createComplement,
  createTetrad,
  createTriad,
  createMonochromatic,
  createShades,
  createSplit,
  hex3to6,
} from "../util";

import "../css/Palette.css";

export default function Palette({ type, hex, corrected, name, selected }) {
  const [names, setNames] = useState([]);
  const [palette, setPalette] = useState("");
  const colors = createColorPalette(type, hex);

  function createColorPalette(type, color) {
    switch (type) {
      case "comp":
        return createComplement(color);

      case "split":
        return createSplit(color);

      case "adjacent":
        return createAdjacent(color);

      case "tetrad":
        return createTetrad(color);

      case "triad":
        return createTriad(color);

      case "mono":
        return createMonochromatic(color);

      case "shades":
        return createShades(color);
    }
  }

  const colorNames = colors.map((color) => hex3to6(color.hex)).join();
  const correctedColorNames = colors
    .map((color) => hex3to6(color.corrected.hex))
    .join();

  useEffect(() => {
    async function getColorName(cNames, crNames) {
      const res = await fetch(
        `https://api.color.pizza/v1/${cNames},${crNames}`
      );
      const names = await res.json();
      setNames(names.colors);
      setPalette(names.paletteTitle);
    }

    getColorName(colorNames, correctedColorNames);
  }, [hex]);

  return (
    <div className="palette-container">
      <header>
        <Circle
          colors={colors}
          type={type === "mono" || type === "shades" ? "circle" : "standard"}
        />
        <h2>{name}</h2>
        <div className="gradients">
          <div className="gradient"></div>
          <div className="gradient"></div>
          <div className="gradient"></div>
        </div>
      </header>
      <div className="palette">
        <Color
          corrected={corrected}
          color={colors}
          selected={selected}
          names={names}
        />
        <Controls palette={palette} />
      </div>
    </div>
  );
}
