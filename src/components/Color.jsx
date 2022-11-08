import "../css/Color.css";
import Copy from "./Copy";

export default function Color({ color }) {
  const corrected = false;
  return (
    <div className={"colors colors-" + color.length}>
      {color.map((c, index) => {
        return (
          <article
            key={index}
            className="color-swatch"
            style={{
              backgroundColor: !corrected ? c.hex : c.corrected.hex,
              color: !corrected ? c.contrast : c.corrected.contrast,
            }}
          >
            <Copy text={c.hex} />
          </article>
        );
      })}
    </div>
  );
}
