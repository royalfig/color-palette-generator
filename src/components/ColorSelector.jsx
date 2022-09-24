import "../css/ColorSelector.css";
import Color from "colorjs.io";
import { useEffect, useState } from "react";
import { hex3to6 } from "../util";

export default function ColorSelector({ setColor, color, children }) {
  const colorData = new Color(color);
  const [colorName, setColorName] = useState("");

  const hexToSend = hex3to6(color);

  const hex = colorData.toString({ format: "hex" });
  const rgb = colorData.toString({ format: "srgb", precision: 2 });
  const hsl = colorData.to("hsl").toString({ precision: 2 });

  useEffect(() => {
    async function getColorName(color) {
      const res = await fetch(`https://api.color.pizza/v1/${color}`);
      const name = await res.json();
      console.log(name);
      setColorName(name.colors[0].name);
    }

    getColorName(hexToSend);
  }, [color]);

  return (
    <div>
      <div className="color-selector">
        <div className="color-input">
          <input type="color" onChange={setColor} value={color}></input>
          <p>Pick a color, any color</p>
          <div className="gradients">
            <div className="gradient"></div>
            <div className="gradient"></div>
            <div className="gradient"></div>
          </div>
        </div>
        <div className="color-details">
          <p>{hex}</p>
          <p>{rgb}</p>
          <p>{hsl}</p>
        </div>
        <div className="background-color-name">
          <p>{colorName}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
