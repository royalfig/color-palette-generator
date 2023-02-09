import "../css/ColorSelector.css";
import "../css/EyeDropper.css";
import { useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import ColorUtil from "colorjs.io";
import { Clipboard, Eyedropper } from "react-bootstrap-icons";
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
          <header className="color-input-heading gradient-header">
            <h2>Start</h2>
            <div className="flex">
              <p>{name}</p>
              <Clipboard />
            </div>
          </header>

          <section className="color-input-container">
            <HexColorPicker color={color} onChange={setColor} />
          </section>

          <section className="color-input-text">
            <div>
              <label htmlFor="hex" className="color-selector-text-input-label">
                HEX
              </label>
              <HexColorInput id="hex" color={color} onChange={setColor} />
            </div>
            <div>
              <label htmlFor="rgb" className="color-selector-text-input-label">
                RGB
              </label>
              <input type="text" id="rgb" value={rgb} />
            </div>
            <div>
              <label htmlFor="hsl" className="color-selector-text-input-label">
                HSL
              </label>
              <input type="text" id="hsl" value={hsl} />
            </div>
            <div>
              <label htmlFor="lch" className="color-selector-text-input-label">
                LCH
              </label>
              <input type="text" id="lch" value={lch} />
            </div>
            <div className="previous">
              <button className="eyedropper" onClick={handleEyedropper}>
                <Eyedropper />
              </button>

              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </section>
        </div>
      </div>
      {children}
    </div>
  );
}
