import "../css/Panel.css";
import {
  BracesAsterisk,
  Lightbulb,
  Palette,
  MoonStars,
  Sun,
} from "react-bootstrap-icons";
import { useState, useEffect } from "react";
import Color from "colorjs.io";
import { hex3to6 } from "../util";
import toast from "react-hot-toast";

export default function Panel({
  setCorrected,
  corrected,
  selected,
  setSelected,
  color,
}) {
  let dark = false;

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

  function handleCorrected() {
    setCorrected(!corrected);
    const state = !corrected ? "enabled" : "disabled";
    toast(`Relative luminance ${state}`, { icon: "💡" });
  }

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
    <div className="panel">
      <div className="panel-left">
        <button
          onClick={handleCorrected}
          className={corrected ? "active icon-button" : "icon-button"}
        >
          <Lightbulb />
        </button>
        <button className="icon-button">
          <BracesAsterisk />
        </button>
        <button className="icon-button">
          <Palette />
        </button>
        <button className="icon-button">
          {dark ? <Sun /> : <MoonStars />}
        </button>

        <div className="panel-divider"></div>

        <div className="selected-group">
          <button
            className={selected === "hex" ? "active" : undefined}
            onClick={() => setSelected("hex")}
          >
            Hex
          </button>
          <button
            className={selected === "rgb" ? "active" : undefined}
            onClick={() => setSelected("rgb")}
          >
            Rgb
          </button>
          <button
            className={selected === "hsl" ? "active" : undefined}
            onClick={() => setSelected("hsl")}
          >
            Hsl
          </button>
          <button
            className={selected === "lch" ? "active" : undefined}
            onClick={() => setSelected("lch")}
          >
            Lch
          </button>
          <button
            className={selected === "name" ? "active" : undefined}
            onClick={() => setSelected("name")}
          >
            Name
          </button>
          <button
            className={selected === "contrast" ? "active" : undefined}
            onClick={() => setSelected("contrast")}
          >
            Contrast
          </button>
        </div>
      </div>
      <p>{valueToShow[selected]}</p>
    </div>
  );
}
