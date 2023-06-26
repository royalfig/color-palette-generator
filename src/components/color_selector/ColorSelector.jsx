import { useContext, useEffect, useState } from "react";
import { ClockHistory } from "react-bootstrap-icons";
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
import ColorTextInput from "../color_text_input/ColorTextInput";
import Header from "../Header";
import EyeDropper from "../eye_dropper/EyeDropper";
import "./colorSelector.css";

export default function ColorSelector() {
  const colors = useContext(ColorContext);

  console.log(colors);

  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");

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

  // Probably need to useEffect to update all inputs, then also wouldn't need to update the state in the parseColor function

  // ideal logic -> set other inputs except for current.
  // useEffect [colorBeingChanged...?]
  // Or debounce input...

  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    if (!debouncedValue) return;
    console.log("debounced value changed");
    const debounced = setTimeout(() => {
      colors.setColor(debouncedValue);
    }, 1000);

    return () => {
      clearTimeout(debounced);
    };
  }, [debouncedValue]);

  function parseColor(e) {
    const { value, id } = e.target;
    let result;

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
      console.log(
        "🚀 ~ file: ColorSelector.jsx:121 ~ parseColor ~ result:",
        result
      );
      setValidationError("");
      setDebouncedValue(result);
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
        <ColorTextInput label="HEX" value={hex} />

        <ColorTextInput label="RGB" value={rgb} />

        <ColorTextInput label="HSL" value={hsl} />

        <ColorTextInput label="LCH" value={lch} />

        <ColorTextInput label="OKLCH" value={oklch} />

        <ColorTextInput label="LAB" value={lab} />

        <ColorTextInput label="OKLAB" value={oklab} />

        {validationError ? <p>{validationError}</p> : <p></p>}
      </form>

      <footer className="previous">
        <EyeDropper />

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
