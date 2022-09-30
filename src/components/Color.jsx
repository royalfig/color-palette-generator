import "../css/Color.css";
import Copy from "./Copy";

export default function Color({ color, corrected, selected, names }) {
  const correctedNames = names.slice(names.length / 2);

  function getValue(c, index) {
    if (corrected && selected === "name") {
      return correctedNames[index].name;
    }

    if (!corrected & (selected === "name")) {
      return names[index].name;
    }

    if (!corrected) {
      return c[selected];
    }

    if (corrected) {
      return c.corrected[selected];
    }
  }

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
            <Copy text={getValue(c, index)} />
          </article>
        );
      })}
    </div>
  );
}
