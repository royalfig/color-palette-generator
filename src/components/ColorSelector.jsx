import ColorUtil from "colorjs.io";
import { useEffect, useState } from "react";
import { ClockHistory, Eyedropper, Clipboard } from "react-bootstrap-icons";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { toast } from "react-toastify";
import "../css/ColorSelector.css";
import "../css/EyeDropper.css";
import { hex3to6 } from "../util";
import Copy from "./buttons/Copy";
import Button from "./buttons/Button";

async function copy(textToCopy) {
  try {
    navigator.clipboard.writeText(textToCopy);
    toast(`"${textToCopy}" copied!`, {
      position: toast.POSITION.BOTTOM_LEFT,
    });
  } catch (e) {
    console.log(e);
  }
}

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
    <div className="color-selector">
      <header>
        <h2>Start</h2>
        <div>
          <p>{name}</p>
          <Button type="icon-btn" handler={copy.bind(null, name)}>
            <Clipboard />
          </Button>
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
        <p>Validation Error</p>
      </section>

      <footer className="previous">
        <Button type="text-icon-btn" handler={handleEyedropper}>
          <Eyedropper /> Eyedropper
        </Button>

        <div className="color-history">
          <ClockHistory />
          <div></div>
          <div></div>
          <div></div>
        </div>
      </footer>
    </div>
  );
}
