import "../css/Controls.css";
import Button from "./buttons/Button";
import { useState } from "react";

export default function Controls({ setDisplayValue }) {
  const [variation, setVariation] = useState(0);
  const [property, setProperty] = useState("hex");

  const variations = ["Original", "Cinematic", "Keel", "Languid", "Sharkbite"];

  function handleVariation(i) {
    setVariation(i);
  }

  function handleProperty(e) {
    const prop = e.currentTarget.innerText.toLowerCase();
    setProperty(prop);
    setDisplayValue(prop);
  }

  return (
    <div className="controls">
      <div className="controls-variations">
        {variations.map((v, i) => (
          <Button
            key={i}
            type="text-btn"
            handler={handleVariation.bind(null, i)}
            classes={i === variation ? "active" : ""}
          >
            {i + 1}
          </Button>
        ))}
        <p className="controls-variation">{variations[variation]}</p>
      </div>

      <div className="controls-properties">
        <Button type="text-btn" handler={(e) => handleProperty(e)}>
          HEX
        </Button>
        <Button type="text-btn" handler={(e) => handleProperty(e)}>
          RGB
        </Button>
        <Button type="text-btn" handler={(e) => handleProperty(e)}>
          HSL
        </Button>
        <Button type="text-btn" handler={(e) => handleProperty(e)}>
          LCH
        </Button>
        <Button type="text-btn" handler={(e) => handleProperty(e)}>
          CSS
        </Button>
      </div>
    </div>
  );
}
