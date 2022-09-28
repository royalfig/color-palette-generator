import "../css/ColorSelector.css";
import Color from "colorjs.io";

export default function ColorSelector({ setColor, color, children }) {
  const colorData = new Color(color);

  const hex = colorData.toString({ format: "hex" });
  const rgb = colorData.toString({ format: "srgb", precision: 2 });
  const hsl = colorData.to("hsl").toString({ precision: 2 });
  const lch = colorData.to("lch").toString({ precision: 2 });

  return (
    <div>
      <div className="color-selector">
        <div className="color-input">
          <input type="color" onChange={setColor} value={color}></input>
          <p>Pick a color, any color</p>
          <div className="gradients">
            <div className="gradient"></div>
            <div className="gradient"></div>
            <div className="gradient"></div>
          </div>
        </div>
        <div className="color-details">
          <p>{hex}</p>
          <p>{rgb}</p>
          <p>{hsl}</p>
          <p>{lch}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
