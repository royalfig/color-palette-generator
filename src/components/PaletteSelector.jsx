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
            <button
              key={idx}
              className={`palette-selector-card ${
                palette.name === colors.name ? "active" : ""
              }`}
              onClick={handlePaletteType}
              data-name={colors.name}
            >
              <Circle
                colors={colors}
                type={
                  colors.name === "tones" || colors.name === "tints and shades"
                    ? "circle"
                    : "default"
                }
                size="small"
              />
              <p>{colors.name}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
