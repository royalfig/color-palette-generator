import { useState } from "react";
import Button from "../button/Button";
import "./Controls.css";

export default function Controls({ setDisplayValue, variation, setVariation }) {
  const [property, setProperty] = useState("hex");

  const variations = ["Original", "Cinematic", "Keel", "Languid", "Sharkbite"];

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
            handler={setVariation.bind(null, i)}
            classes={i === variation ? "active" : ""}
          >
            {i + 1}
          </Button>
        ))}
        <p className="controls-variation">{variations[variation]}</p>
      </div>

      <div className="controls-properties">
        <Button
          type="text-btn"
          handler={(e) => handleProperty(e)}
          classes={property === "hex" ? "active" : ""}
        >
          HEX
        </Button>
        <Button
          type="text-btn"
          handler={(e) => handleProperty(e)}
          classes={property === "rgb" ? "active" : ""}
        >
          RGB
        </Button>
        <Button
          type="text-btn"
          handler={(e) => handleProperty(e)}
          classes={property === "hsl" ? "active" : ""}
        >
          HSL
        </Button>
        <Button
          type="text-btn"
          handler={(e) => handleProperty(e)}
          classes={property === "lch" ? "active" : ""}
        >
          LCH
        </Button>
        <Button
          type="text-btn"
          handler={(e) => handleProperty(e)}
          classes={property === "code" ? "active" : ""}
        >
          CODE
        </Button>
        <Button
          type="text-btn"
          handler={(e) => handleProperty(e)}
          classes={property === "name" ? "active" : ""}
        >
          NAME
        </Button>
      </div>
    </div>
  );
}
