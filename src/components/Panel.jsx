import "../css/Panel.css";
import { useState, useEffect } from "react";
import { hex3to6 } from "../util";
export default function Panel({ setCorrected, corrected, color }) {
  const [colorName, setColorName] = useState("");

  const hexToSend = hex3to6(color);

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
    <div className="panel">
      <div className="panel-controls">
        <div className="y-selector">
          <input
            id="y"
            type="checkbox"
            onChange={setCorrected}
            checked={corrected}
          />
          <label htmlFor="y">Enable relative luminance</label>
        </div>
        <div className="css-copy">
          <button>Copy CSS</button>
        </div>
      </div>
      <p className="panel-color-name">{colorName}</p>
    </div>
  );
}
