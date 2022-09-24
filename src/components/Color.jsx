import "../css/Color.css";
import { y } from "../util";

export default function Color({ color, corrected }) {
  if (!color)
    return (
      <div>
        <p>...</p>
      </div>
    );

  return !corrected ? (
    <div className="colors">
      {color.map((c, index) => {
        return (
          <article key={index}>
            <div
              className="color-swatch"
              style={{ backgroundColor: c.hex }}
            ></div>
            <footer>
              <p>
                {c.y} / {c.l}
              </p>
            </footer>
          </article>
        );
      })}
    </div>
  ) : (
    <div className="colors">
      {color.map((c, index) => {
        return (
          <article key={index}>
            <div
              className="color-swatch"
              style={{ backgroundColor: c.corrected.hex }}
            ></div>
            <footer>
              <p>
                {c.corrected.y} / {c.corrected.l}
              </p>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
