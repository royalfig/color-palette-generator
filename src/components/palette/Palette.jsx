import { useEffect, useState } from "react";
import { hex3to6 } from "../../util";
import Circle from "../circle/Circle";
import Color from "../color_swatch/ColorSwatch";
import Controls from "../controls/Controls";
import Header from "../header/Header";
import "./Palette.css";

export default function Palette({
  palette,
  displayValue,
  setDisplayValue,
  variation,
  setVariation,
}) {
  const [paletteTitle, setPaletteTitle] = useState("");
  const [colorTitles, setColorTitles] = useState([]);
  const colors = palette.variations[variation]
    .map((color) => hex3to6(color.hex))
    .join();

  async function getColorName(color) {
    const res = await fetch(`https://api.color.pizza/v1/${color}`);
    const names = await res.json();
    setColorTitles(names.colors);
    setPaletteTitle(names.paletteTitle);
  }

  useEffect(() => {
    getColorName(colors);
  }, [palette, variation]);

  return (
    <section className="palette-container">
      <Header h2={palette.name} text={paletteTitle}>
        <Circle
          colors={palette}
          type={
            palette.name === "tones" ||
            palette.name === "tints and shades" ||
            palette.name === "polychroma" ||
            palette.name === "ombre"
              ? "circle"
              : "default"
          }
          size="large"
        />
      </Header>

      <div className="palette">
        <Color
          color={palette}
          displayValue={displayValue}
          colorTitles={colorTitles}
          variation={variation}
        />
      </div>

      <Controls
        paletteTitle={paletteTitle}
        setDisplayValue={setDisplayValue}
        variation={variation}
        setVariation={setVariation}
      />
    </section>
  );
}