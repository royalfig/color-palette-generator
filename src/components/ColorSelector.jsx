import "../css/ColorSelector.css";

import { HexColorPicker, HexColorInput } from "react-colorful";

export default function ColorSelector({ setColor, color, children }) {
  return (
    <div>
      <div className="color-selector">
        <div className="color-input">
          <div className="color-input-heading">
            <h1>Pick a color, any color</h1>
            <div className="gradients">
              <div className="gradient"></div>
              <div className="gradient"></div>
              <div className="gradient"></div>
            </div>
          </div>
          <div className="color-input-container">
            <HexColorPicker color={color} onChange={setColor} />
          </div>
          <div className="color-input-container values">
            <HexColorInput color={color} onChange={setColor} prefixed />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
