import "../css/Palette.css";

import { useState, useEffect } from "react";
import Color from "./Color";
import Controls from "./Controls";
import Circle from "./Circle";

export default function Palette({ palette }) {
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
        />
        <h2>{palette[0].name}</h2>
        <div className="gradients">
          <div className="gradient"></div>
          <div className="gradient"></div>
          <div className="gradient"></div>
        </div>
      </header>
      <div className="palette">
        <Color color={palette} />
        <Controls paletteName="" />
      </div>
    </div>
  );
}
