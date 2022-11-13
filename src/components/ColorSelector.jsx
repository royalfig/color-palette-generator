import "../css/ColorSelector.css";
import { useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import ColorUtil from "colorjs.io";
import { Eyedropper } from "react-bootstrap-icons";
import { useEffect } from "react";
import { hex3to6 } from "../util";

export default function ColorSelector({ setColor, color, children }) {
  const pickedColor = new ColorUtil(color);

  const hex = pickedColor.toString({ format: "hex" });
  const hsl = pickedColor.to("hsl").toString({ precision: 2 });
  const rgb = pickedColor.to("srgb").toString({ precision: 2 });
  const lch = pickedColor.to("lch").toString({ precision: 2 });

  const [name, setName] = useState("");

  async function getName(color) {
    const hexFormatted = hex3to6(color);

    try {
      const res = await fetch(`https://api.color.pizza/v1/${hexFormatted}`);
      const name = await res.json();
      setName(name?.colors[0]?.name);
    } catch (e) {
      throw Error(e);
    }
  }

  useEffect(() => {
    getName(color);
  });

  async function handleEyedropper(e) {
    const eyeDropper = new EyeDropper();

    eyeDropper
      .open()
      .then((result) => {
        setColor(result.sRGBHex);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  return (
    <div>
      <div className="color-selector">
        <div className="color-input">
          <section className="color-input-heading gradient-header">
            <h2>Color</h2>
            <div className="gradients">
              <div className="gradient"></div>
              <div className="gradient"></div>
              <div className="gradient"></div>
            </div>
          </section>

          <section className="color-input-container">
            <HexColorPicker color={color} onChange={setColor} />
            <div className="color-input-container-right">
              <div>
                <label
                  htmlFor="hex"
                  className="color-selector-text-input-label"
                >
                  Text Input
                </label>
                <HexColorInput id="hex" color={color} onChange={setColor} />
              </div>
              {window.EyeDropper ? (
                <button className="eye-dropper" onClick={handleEyedropper}>
                  <Eyedropper /> <span>Eye dropper</span>
                </button>
              ) : undefined}
              <div className="color-input-info">
                <p>{name}</p>
                <p>{hex}</p>
                <p>{hsl}</p>
                <p>{rgb}</p>
                <p>{lch}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      {children}
    </div>
  );
}
