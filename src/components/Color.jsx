import "./Color.css";

export default function Color({ color, corrected }) {
  console.log(corrected);

  return corrected ? (
    <div className="">
      <div className="colors">
        {Object.keys(color).map((key, index) => {
          return (
            <div key={index} className="color">
              <div
                className="color-swatch"
                style={{ backgroundColor: color[key].hex }}
              ></div>
              <p>{color[key].hex}</p>
              <p>{color[key].rgb}</p>
              <p>{color[key].hsl}</p>
            </div>
          );
        })}
      </div>
      <div className="compare">
        {Object.keys(color).map((key, index) => {
          return (
            <div
              key={index}
              className="color-compare"
              style={{ backgroundColor: color[key].hex }}
            ></div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="">
      <div className="colors">
        {Object.keys(color).map((key, index) => {
          return (
            <div key={index} className="color">
              <div
                className="color-swatch"
                style={{ backgroundColor: color[key].hex }}
              ></div>
              <p>{color[key].hex}</p>
              <p>{color[key].rgb}</p>
              <p>{color[key].hsl}</p>
            </div>
          );
        })}
      </div>
      <div className="compare">
        {Object.keys(color).map((key, index) => {
          return (
            <div
              key={index}
              className="color-compare"
              style={{ backgroundColor: color[key].hex }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}
