import "../css/ColorSelector.css";

import { HexColorPicker, HexColorInput } from "react-colorful";
import { Eyedropper, Lightbulb } from "react-bootstrap-icons";

export default function ColorSelector({ setColor, color, children }) {
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
            </div>
          </section>
        </div>
      </div>
      {children}
    </div>
  );
}
