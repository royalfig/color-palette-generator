import "../css/Palette.css";

import { useState, useEffect } from "react";
import { hex3to6 } from "../util/";
import Color from "./Color";
import Controls from "./Controls";
import Circle from "./Circle";

export default function Palette({ palette, luminance, displayValue }) {
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
    <div className="palette-container">
      <header>
        <Circle
          colors={palette}
          type={
            palette[0].name === "Monochromatic" || palette[0].name === "Shades"
              ? "circle"
              : "default"
          }
          size="large"
        />
        <h2>{palette[0].name}</h2>
        <div className="gradients">
          <div className="gradient"></div>
          <div className="gradient"></div>
          <div className="gradient"></div>
        </div>
      </header>
      <div className="palette">
        <Color
          color={palette}
          luminance={luminance}
          displayValue={displayValue}
          colorTitles={colorTitles}
        />
        <Controls paletteTitle={paletteTitle} />
      </div>
    </div>
  );
}
