import "../css/Color.css";

export default function Color({ color, corrected, selected, names }) {
  const correctedNames = names.slice(names.length / 2);

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
              <p>{selected === "name" ? names[index].name : c[selected]}</p>
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
                {selected === "name"
                  ? correctedNames[index].name
                  : c.corrected[selected]}
              </p>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
