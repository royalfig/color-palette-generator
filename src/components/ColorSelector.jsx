import ColorUtil from "colorjs.io";
import { values } from "lodash-es";
import { useEffect, useState } from "react";
import { ClockHistory, Eyedropper, Clipboard } from "react-bootstrap-icons";
import { HexColorInput, HexColorPicker } from "react-colorful";
import "../css/ColorSelector.css";
import "../css/EyeDropper.css";
import { hex3to6 } from "../util";
import Button from "./buttons/Button";
import Header from "./Header";

export default function ColorSelector({ setColor, color }) {
  const currentColor = new ColorUtil(color);
  const hexString = currentColor.toString({ format: "hex" });

  const [validationError, setValidationError] = useState("");
  const [name, setName] = useState("");
  const [hex, setHex] = useState(hexString);
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

  // Probably need to useEffect to update all inputs, then also wouldn't need to update the state in the parseColor function
  useEffect(() => {
    setHex(hexString);
  }, [color]);

  function updateValues(valuesToUpdate, newColor) {
    if (valuesToUpdate.includes("hex")) {
      setHex(newColor.to("srgb").toString({ format: "hex" }));
    }

    if (valuesToUpdate.includes("rgb")) {
      setRgb(newColor.to("srgb").toString({ precision: 2 }));
    }

    if (valuesToUpdate.includes("hsl")) {
      setHsl(newColor.to("hsl").toString({ precision: 2 }));
    }

    if (valuesToUpdate.includes("rgb")) {
      setLch(newColor.to("lch").toString({ precision: 2 }));
    }
  }

  function parseColor(e, type) {
    const color = e.target.value;

    setValidationError("");

    switch (type) {
      case "hex":
        const withoutHash = color.replace("#", "");

        if (
          withoutHash.length < 3 ||
          (withoutHash.length > 3 && withoutHash.length < 6)
        ) {
          setHex(color);
          return;
        }

        if (withoutHash.length > 6) {
          setValidationError(
            `Can't parse color. Too many digits (${withoutHex.length})`
          );
        }

        try {
          setHex(color);
          const formattedHexColor = new ColorUtil("#" + withoutHash);
          const newHex = formattedHexColor.toString({ format: "hex" });
          setColor(newHex);
          updateValues(["rgb", "hsl", "lch"], formattedHexColor);
        } catch (error) {
          setValidationError(`Couldn't parse "${color}" as a hex color.`);
        }
        break;
      case "rgb":
        const rgbMatch = color.match(/\d+%?/g);

        if (rgbMatch === null) {
          setRgb(color);
          break;
        }

        if (rgbMatch.length !== 3) {
          setRgb(color);
          break;
        }

        setRgb(color);
        if (rgbMatch.length === 3) {
          try {
            const newRgb = new ColorUtil(
              `rgb(${rgbMatch[0]} ${rgbMatch[1]} ${rgbMatch[2]})`
            );
            const formattedHexColor = newRgb.toString({ format: "hex" });

            setColor(formattedHexColor);
            updateValues(["hex", "hsl", "lch"], newRgb);
          } catch (e) {
            console.log(e);
            setValidationError(`Couldn't parse "${color}" as an RGB color.`);
          } finally {
            break;
          }
        }

        setValidationError(`Couldn't parse "${color}" as an RGB color.`);

        break;
      case "hsl":
        const hslMatch = color.match(/\d+%?/g);

        if (hslMatch === null) {
          setHsl(color);
          break;
        }

        if (hslMatch.length !== 3) {
          setHsl(color);
          break;
        }

        setHsl(color);
        if (hslMatch.length === 3) {
          try {
            const newHsl = new ColorUtil(
              `hsl(${hslMatch[0].replace("%", "")} ${
                hslMatch[1].match(/\d+/)[0]
              }% ${hslMatch[2].match(/\d+/)[0]}%)`
            );
            const formattedHexColor = newHsl
              .to("srgb")
              .toString({ format: "hex" });
            setColor(formattedHexColor);
            updateValues(["hex", "rgb", "lch"], newHsl);
          } catch (e) {
            setValidationError(`Couldn't parse "${color}" as an HSL color.`);
          } finally {
            break;
          }
        }

        setValidationError(`Couldn't parse "${color}" as an HSL color.`);
      case "lch":
        const lch = color.match(/\d+%?/g);

        if (lch === null) {
          setLch(color);
          break;
        }

        if (lch.length !== 3) {
          setLch(color);
          break;
        }

        setLch(color);
        if (lch.length === 3) {
          try {
            const newLch = new ColorUtil(
              `lch(${lch[0].match(/\d+/)[0]}% ${lch[1].match(/\d+/)[0]} ${
                lch[2].match(/\d+/)[0]
              })`
            );
            const formattedHexColor = newLch
              .to("srgb")
              .toString({ format: "hex" });
            setColor(formattedHexColor);
            updateValues(["hex", "rgb", "hsl"], newLch);
          } catch (e) {
            setValidationError(`Couldn't parse "${color}" as an LCH color.`);
          } finally {
            break;
          }
        }

        setValidationError(`Couldn't parse "${color}" as an LCH color.`);
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
          <input
            value={hex}
            onChange={(e) => parseColor(e, "hex")}
            onBlur={() => setHex(color)}
          />
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
            onBlur={() =>
              setRgb(currentColor.to("srgb").toString({ precision: 2 }))
            }
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
            onBlur={() =>
              setHsl(currentColor.to("hsl").toString({ precision: 2 }))
            }
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
