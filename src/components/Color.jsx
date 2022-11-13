import "../css/Color.css";
import Copy from "./Copy";

export default function Color({ color, luminance, displayValue, colorTitles }) {
  if (colorTitles.length) {
    color.forEach((c, idx) => {
      c.title = colorTitles[idx]?.name;
      c.corrected.title = colorTitles[idx]?.name;
      return color;
    });
  }

  return (
    <div className={"colors colors-" + color.length}>
      {color.map((c, index) => {
        return (
          <article
            key={index}
            className="color-swatch"
            style={{
              backgroundColor:
                luminance === "absolute" ? c.hex : c.corrected.hex,
              color:
                luminance === "absolute" ? c.contrast : c.corrected.contrast,
            }}
          >
            <Copy
              text={
                luminance === "absolute"
                  ? c[displayValue]
                  : c.corrected[displayValue]
              }
            />
          </article>
        );
      })}
    </div>
  );
}
