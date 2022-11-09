import "../css/PaletteSelector.css";
import Circle from "./Circle";

export default function PaletteSelector({ palettes, handlePalette, palette }) {
  return (
    <section className="palette-selector">
      <header className="palette-selector-header">
        <h2>Palette</h2>
        <div className="gradients">
          <div className="gradient"></div>
          <div className="gradient"></div>
          <div className="gradient"></div>
        </div>
      </header>
      {palettes.map((colors, idx) => {
        let className = "palette-selector-card";

        if (palette[0].name === colors[0].name) {
          className += " active";
        }

        return (
          <button
            key={idx}
            className={className}
            onClick={handlePalette}
            data-name={colors[0].name}
          >
            <Circle
              colors={colors}
              type={
                colors[0].name === "Monochromatic" ||
                colors[0].name === "Shades"
                  ? "circle"
                  : "default"
              }
              size="small"
            />
            <p>{colors[0].name}</p>
          </button>
        );
      })}
    </section>
  );
}
