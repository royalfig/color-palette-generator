import "../css/ColorSelector.css";
import { useState, useEffect, useCallback } from "react";
import Color from "colorjs.io";
import { hex3to6 } from "../util";

import { debounce } from "lodash-es";

export default function ColorSelector({ setColor, color, children }) {
  const [colorName, setColorName] = useState("");

  const colorData = new Color(color);
  const hexToSend = hex3to6(color);
  console.log("INIT", new Date());

  const deb = useCallback(
    debounce(async function getColorName(color) {
      console.log("called", new Date());
      const res = await fetch(`https://api.color.pizza/v1/${color}`);
      const name = await res.json();
      setColorName(name.colors[0].name);
    }, 1000),
    []
  );

  useEffect(() => {
    deb(hexToSend);
  }, [color]);

  const hex = colorData.toString({ format: "hex" });
  const rgb = colorData.toString({ format: "srgb", precision: 2 });
  const hsl = colorData.to("hsl").toString({ precision: 2 });
  const lch = colorData.to("lch").toString({ precision: 2 });

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
