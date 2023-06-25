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

export default function ColorSelector({ setColor, color }) {
  const colors = useContext(ColorContext);

  console.log("color selector is runnijng");

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
      setColor(debouncedValue);
    }, 1500);

    return () => {
      clearTimeout(debounced);
    };
  }, [debouncedValue]);

  function parseColor(e, type) {
    const color = e.target.value;
    let result;

    switch (type) {
      case "hex": {
        result = validateHex(color, setValidationError);
        console.log(result);
        break;
      }
      case "rgb": {
        result = validateRgb(color, setValidationError);
        break;
      }
      case "hsl": {
        result = validateHsl(color, setValidationError);
        break;
      }
      case "lch": {
        result = validateLch(color, setValidationError);
        break;
      }
      case "oklch": {
        result = validateOkLch(color, setValidationError);
        break;
      }
      case "lab": {
        result = validateLab(color, setValidationError);
        break;
      }
      case "oklab": {
        result = validateOkLab(color, setValidationError);
        break;
      }
    }

    if (result) {
      console.log("result");
      setValidationError("");

      setDebouncedValue(result);
    }
  }

  useEffect(() => {
    getName(color);
  }, [color]);

  return (
    <div className="color-selector">
      <Header h2="Start" text={name} />

      <section className="color-input-container">
        <HexColorPicker color={color} onChange={setColor} />
      </section>

      <form className="color-input-text">
        <ColorTextInput label="HEX" value={hex} parseColor={parseColor} />

        <ColorTextInput label="RGB" value={rgb} parseColor={parseColor} />

        <ColorTextInput label="HSL" value={hsl} parseColor={parseColor} />

        <ColorTextInput label="LCH" value={lch} parseColor={parseColor} />

        <ColorTextInput label="OKLCH" value={oklch} parseColor={parseColor} />

        <ColorTextInput label="LAB" value={lab} parseColor={parseColor} />

        <ColorTextInput label="OKLAB" value={oklab} parseColor={parseColor} />
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
