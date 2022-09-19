import "./Color.css";
import { ColorName } from "./ColorName";

export default function Color({ color, corrected }) {
  return !corrected ? (
    <div className="color-container">
      <div className="colors">
        {color.map((c, index) => {
          return (
            <div key={index} className="color">
              <div
                className="color-swatch"
                style={{ backgroundColor: c.hex }}
              ></div>
              <ColorName hex={c.hex} />
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="color-container">
      <h2>corrected</h2>
      <div className="colors">
        {color.map((c, index) => {
          return (
            <div key={index} className="color">
              <div
                className="color-swatch"
                style={{ backgroundColor: c.corrected.hex }}
              ></div>
              <p>{c.corrected.hex}</p>
              <p>{c.corrected.rgb}</p>
              <p>{c.corrected.hsl}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
