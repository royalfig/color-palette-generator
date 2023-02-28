import "../css/Color.css";
import Copy from "./Copy";

export default function Color({ color, displayValue, colorTitles, variation }) {
  if (colorTitles.length) {
    color.variations[variation].forEach((c, idx) => {
      c.name = colorTitles[idx]?.name;
      return color;
    });
  }

  return (
    <div className={"colors colors-" + color.variations[variation].length}>
      {color.variations[variation].map((c, idx) => {
        return (
          <article
            key={idx}
            className="color-swatch"
            style={{
              backgroundColor: c.hex,
              color: c.contrast,
            }}
          >
            <Copy text={c[displayValue]} />
          </article>
        );
      })}
    </div>
  );
}
