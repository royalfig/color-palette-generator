import "./Color.css";

export default function Color({ color, corrected }) {
  console.log(color);
  return !corrected ? (
    <div className="">
      <div className="colors">
        {color.map((c, index) => {
          return (
            <div key={index} className="color">
              <div
                className="color-swatch"
                style={{ backgroundColor: c.hex }}
              ></div>
              <p>{c.hex}</p>
              <p>{c.rgb}</p>
              <p>{c.hsl}</p>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="">
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
