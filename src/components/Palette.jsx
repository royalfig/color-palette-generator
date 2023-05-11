import "../css/Palette.css";

import { useState, useEffect } from "react";
import { hex3to6 } from "../util/";
import Color from "./Color";
import Controls from "./Controls";
import Circle from "./Circle";
import Header from "./Header";

export default function Palette({
  palette,
  displayValue,
  setDisplayValue,
  variation,
  setVariation,
}) {
  console.log("🚀 ~ file: Palette.jsx:17 ~ palette:", palette);
  const [paletteTitle, setPaletteTitle] = useState("");
  const [colorTitles, setColorTitles] = useState([]);

  const colors = palette.variations[variation]
    .map((color) => hex3to6(color.hex))
    .join();

  async function getColorName(color) {
    const res = await fetch(`https://api.color.pizza/v1/${color}`);
    const names = await res.json();
    setColorTitles(names.colors);
    setPaletteTitle(names.paletteTitle);
  }

  useEffect(() => {
    getColorName(colors);
  }, [palette, variation]);

  return (
    <section className="palette-container">
      <Header h2={palette.name} text={paletteTitle}>
        <Circle
          colors={palette}
          type={
            palette.name === "tones" ||
            palette.name === "tints and shades" ||
            palette.name === "polychroma"
              ? "circle"
              : "default"
          }
          size="large"
        />
      </Header>

      <div className="palette">
        <Color
          color={palette}
          displayValue={displayValue}
          colorTitles={colorTitles}
          variation={variation}
        />
      </div>

      <Controls
        paletteTitle={paletteTitle}
        setDisplayValue={setDisplayValue}
        variation={variation}
        setVariation={setVariation}
      />
    </section>
  );
}
