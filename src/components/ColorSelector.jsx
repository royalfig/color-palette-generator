import "../css/ColorSelector.css";
import { useState, useEffect } from "react";
import Color from "colorjs.io";
import { hex3to6 } from "../util";
import { HexColorPicker, HexColorInput } from "react-colorful";

export default function ColorSelector({ setColor, color, selected, children }) {
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

  const valueToShow = {
    name: colorName,
    hex: colorData.toString({ format: "hex" }),
    rgb: colorData.toString({ format: "srgb", precision: 2 }),
    hsl: colorData.to("hsl").toString({ precision: 2 }),
    lch: colorData.to("lch").toString({ precision: 2 }),
    contrast:
      colorData.contrast("black", "wcag21") >
      colorData.contrast("white", "wcag21")
        ? "#000"
        : "#fff",
  };

  return (
    <div>
      <div className="color-selector">
        <div className="color-input">
          <div className="color-input-heading">
            <h1>Pick a color, any color</h1>
            <div className="gradients">
              <div className="gradient"></div>
              <div className="gradient"></div>
              <div className="gradient"></div>
            </div>
          </div>
          <div className="color-input-container">
            <HexColorPicker color={color} onChange={setColor} />
          </div>
          <div className="color-input-container values">
            <HexColorInput color={color} onChange={setColor} prefixed />
            <p>{valueToShow[selected]}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
