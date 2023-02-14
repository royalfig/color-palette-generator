import "../css/PaletteSelector.css";
import Circle from "./Circle";
import Header from "./Header";
import { useState } from "react";

export default function PaletteSelector({ palettes, handlePalette, palette }) {
  const [paletteType, setPaletteType] = useState("Complementary");

  function handlePaletteType(e) {
    handlePalette(e);

    setPaletteType(e?.currentTarget?.dataset?.name);
  }

  return (
    <section className="palette-selector">
      <Header h2="Palette" text={paletteType} />

      <div className="palette-selector-container">
        {palettes.map((colors, idx) => {
          return (
            <div
              className={`palette-selector-card-gradient ${
                palette[0].name === colors[0].name ? "active" : ""
              }`}
            >
              <button
                key={idx}
                className={`palette-selector-card ${
                  palette[0].name === colors[0].name ? "active" : ""
                }`}
                onClick={handlePaletteType}
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
