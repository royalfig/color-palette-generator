import "../css/ColorSelector.css";
import { useState, useEffect, useCallback } from "react";
import Color from "colorjs.io";
import { hex3to6 } from "../util";

export default function ColorSelector({ setColor, color, children }) {
  const [colorName, setColorName] = useState("");

  const colorData = new Color(color);
  const hexToSend = hex3to6(color);

  async function getColorName(color) {
    const res = await fetch(`https://api.color.pizza/v1/${color}`);
    const name = await res.json();
    setColorName(name.colors[0].name);
  }

  useEffect(() => {
    getColorName(hexToSend);
  }, [color]);

  const hex = colorData.toString({ format: "hex" });
  const rgb = colorData.toString({ format: "srgb", precision: 2 });
  const hsl = colorData.to("hsl").toString({ precision: 2 });
  const lch = colorData.to("lch").toString({ precision: 2 });

  return (
    <div>
      <div className="color-selector">
        <div className="color-input">
          <input
            type="color"
            onChange={(e) => {
              console.log(e.target.value);
              setColor(e.target.value);
            }}
            value={color}
          ></input>
          <p>Pick a color, any color</p>
          <div className="gradients">
            <div className="gradient"></div>
            <div className="gradient"></div>
            <div className="gradient"></div>
          </div>
        </div>
        <div className="color-details">
          <p>{colorName}</p>
          <p>{hex}</p>
          <p>{rgb}</p>
          <p>{hsl}</p>
          <p>{lch}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
