import { useContext, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  hex3to6,
  validateHex,
  validateHsl,
  validateLab,
  validateLch,
  validateOkLab,
  validateOkLch,
  validateRgb,
} from "../../util";
import { ColorContext } from "../ColorContext";
import Header from "../header/Header";
import ColorHistory from "../color_history/ColorHistory";
import ColorTextInput from "../color_text_input/ColorTextInput";
import EyeDropper from "../eye_dropper/EyeDropper";
import "./colorSelector.css";

export default function ColorSelector({ colorHistory, setColorHistory }) {
  const colors = useContext(ColorContext);

  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [debouncedValue, setDeouncedValue] = useState();

  const hex = colors.base.hex;
  const rgb = colors.base.rgb;
  const hsl = colors.base.hsl;
  const lch = colors.base.lch;
  const oklch = colors.base.oklch;
  const lab = colors.base.lab;
  const oklab = colors.base.oklab;

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

  useEffect(() => {
    if (!debouncedValue) return;
    const timeout = setTimeout(() => {
      console.log("debouncing");
      console.timeStamp();
      setValidationError("");
      colors.setColor(debouncedValue);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [debouncedValue]);

  function parseColor(e) {
    const { value, id } = e.target;
    let result;
    setLoading(false);

    switch (id) {
      case "hex": {
        result = validateHex(value, setValidationError);
        break;
      }
      case "rgb": {
        result = validateRgb(value, setValidationError);
        break;
      }
      case "hsl": {
        result = validateHsl(value, setValidationError);
        break;
      }
      case "lch": {
        result = validateLch(value, setValidationError);
        break;
      }
      case "oklch": {
        result = validateOkLch(value, setValidationError);
        break;
      }
      case "lab": {
        result = validateLab(value, setValidationError);
        break;
      }
      case "oklab": {
        result = validateOkLab(value, setValidationError);
        break;
      }
    }

    if (result) {
      console.log("setting loading");
      console.timeStamp();
      setLoading(true);
      setValidationError("");
      setDeouncedValue(result);
    }
  }

  useEffect(() => {
    getName(colors.base.hex);
  }, [colors.base.hex]);

  return (
    <div className="color-selector">
      <Header h2="Start" text={name} />

      <section className="color-input-container">
        <HexColorPicker color={colors.base.hex} onChange={colors.setColor} />
      </section>

      <form className="color-input-text" onChange={parseColor}>
        <ColorTextInput label="HEX" value={hex} loading={loading} />

        <ColorTextInput label="RGB" value={rgb} loading={loading} />

        <ColorTextInput label="HSL" value={hsl} loading={loading} />

        <ColorTextInput label="LCH" value={lch} loading={loading} />

        <ColorTextInput label="OKLCH" value={oklch} loading={loading} />

        <ColorTextInput label="LAB" value={lab} loading={loading} />

        <ColorTextInput label="OKLAB" value={oklab} loading={loading} />

        {validationError ? <p>{validationError}</p> : <p></p>}
        <p>{colors.base.inGamut}</p>
      </form>

      <footer className="previous">
        <EyeDropper />
        <ColorHistory
          colorHistory={colorHistory}
          setColorHistory={setColorHistory}
        />
      </footer>
    </div>
  );
}
