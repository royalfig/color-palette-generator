import "../css/Panel.css";
import { useState, useEffect } from "react";
import { hex3to6 } from "../util";
export default function Panel({
  setCorrected,
  corrected,
  selected,
  setSelected,
  color,
}) {
  const [colorName, setColorName] = useState("");

  const hexToSend = hex3to6(color);
  const handleSelect = (e) => {
    setSelected(e.target.value);
  };
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

        <div className="select">
          <select value={selected} onChange={handleSelect}>
            <option value="name">Name</option>
            <option value="hex">Hex</option>
            <option value="rgb">Rgb</option>
            <option value="hsl">Hsl</option>
            <option value="lch">Lch</option>
            <option value="contrast">Contrast</option>
            <option value="y">Luminance</option>
          </select>
        </div>

        <div className="css-copy">
          <button>Copy CSS</button>
        </div>
      </div>
      <p className="panel-color-name">{colorName}</p>
    </div>
  );
}
