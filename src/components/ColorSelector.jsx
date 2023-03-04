import ColorUtil from "colorjs.io";
import { useEffect, useState } from "react";
import { ClockHistory, Eyedropper, Clipboard } from "react-bootstrap-icons";
import { HexColorInput, HexColorPicker } from "react-colorful";
import "../css/ColorSelector.css";
import "../css/EyeDropper.css";
import { hex3to6 } from "../util";
import Button from "./buttons/Button";
import Header from "./Header";

export default function ColorSelector({ setColor, color, children }) {
  const currentColor = new ColorUtil(color);

  const [validationError, setValidationError] = useState("");
  const [name, setName] = useState("");

  const [hex, setHex] = useState(currentColor.toString({ format: "hex" }));
  const [rgb, setRgb] = useState(
    currentColor.to("srgb").toString({ precision: 2 })
  );
  const [hsl, setHsl] = useState(
    currentColor.to("hsl").toString({ precision: 2 })
  );
  const [lch, setLch] = useState(
    currentColor.to("lch").toString({ precision: 2 })
  );

  async function getName(color) {
    const hexFormatted = hex3to6(color);

    try {
      const res = await fetch(`https://api.color.pizza/v1/${hexFormatted}`);
      const name = await res.json();
      setName(name?.colors[0]?.name);
    } catch (e) {
      console.log(e.message);
    }
  }

  function parseColor(e, type) {
    const color = e.target.value;
    setValidationError("");

    switch (type) {
      case "hex":
        console.log(e, type);

        const split = color.split(" ");
        console.log(split);

        const withoutHash = color.replace("#", "");

        if (withoutHash.length < 3) {
          setHex(color);
          return;
        }

        if (withoutHash.length > 3 && withoutHash.length < 6) {
          setHex(color);
          return;
        }

        try {
          const color = new ColorUtil("#" + withoutHash);
          const newHex = color.toString({ format: "hex" });
          setHex(newHex);
          setColor(newHex);
        } catch (error) {
          setValidationError(`Couldn't parse "${color}" as a hex color.`);
        }
        break;
      case "rgb":
        const m = color.match(/\d+%?/g);
        console.log(m);
        setRgb(color);
      default:
        break;
    }
  }

  useEffect(() => {
    getName(color);
  }, [color]);

  async function handleEyedropper() {
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
      <Header h2="Start" text={name} />

      <section className="color-input-container">
        <HexColorPicker color={color} onChange={setColor} />
      </section>

      <section className="color-input-text">
        <div>
          <label htmlFor="hex" className="color-selector-text-input-label">
            HEX
          </label>
          <input value={hex} onChange={(e) => parseColor(e, "hex")} />
        </div>
        <div>
          <label htmlFor="rgb" className="color-selector-text-input-label">
            RGB
          </label>
          <input
            type="text"
            id="rgb"
            value={rgb}
            onChange={(e) => parseColor(e, "rgb")}
          />
        </div>
        <div>
          <label htmlFor="hsl" className="color-selector-text-input-label">
            HSL
          </label>
          <input
            type="text"
            id="hsl"
            value={hsl}
            onChange={(e) => parseColor(e, "hsl")}
          />
        </div>
        <div>
          <label htmlFor="lch" className="color-selector-text-input-label">
            LCH
          </label>
          <input
            type="text"
            id="lch"
            value={lch}
            onChange={(e) => parseColor(e, "lch")}
          />
        </div>
        {validationError ? <p>{validationError}</p> : <p></p>}
      </section>

      <footer className="previous">
        {window.EyeDropper ? (
          <Button type="text-icon-btn" handler={handleEyedropper}>
            <Eyedropper /> Eyedropper
          </Button>
        ) : (
          ""
        )}

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
