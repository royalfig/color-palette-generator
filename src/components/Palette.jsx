import "../css/Palette.css";

import { useState, useEffect } from "react";
import { hex3to6 } from "../util/";
import Color from "./Color";
import Controls from "./Controls";
import Circle from "./Circle";
import Header from "./Header";

export default function Palette({
  palette,
  luminance,
  displayValue,
  setDisplayValue,
}) {
  const [paletteTitle, setPaletteTitle] = useState("");
  const [colorTitles, setColorTitles] = useState([]);
  const colors = palette.map((color) => hex3to6(color.hex)).join();

  async function getColorName(color) {
    const res = await fetch(`https://api.color.pizza/v1/${color}`);
    const names = await res.json();
    setColorTitles(names.colors);
    setPaletteTitle(names.paletteTitle);
  }

  useEffect(() => {
    getColorName(colors);
  }, [palette]);

  return (
    <section className="palette-container">
      <Header h2={palette[0].name} text={paletteTitle}>
        <Circle
          colors={palette}
          type={
            palette[0].name === "Monochromatic" || palette[0].name === "Shades"
              ? "circle"
              : "default"
          }
          size="large"
        />
      </Header>

      <div className="palette">
        <Color
          color={palette}
          luminance={luminance}
          displayValue={displayValue}
          colorTitles={colorTitles}
        />
      </div>

      <Controls paletteTitle={paletteTitle} setDisplayValue={setDisplayValue} />
    </section>
  );
}
