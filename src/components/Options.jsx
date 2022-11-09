import "../css/Options.css";
export default function Options({ setDisplayValue, displayValue }) {
  return (
    <div className="options">
      <div className="gradient-heading">
        <h2>Display</h2>
        <div className="gradients">
          <div className="gradient"></div>
          <div className="gradient"></div>
          <div className="gradient"></div>
        </div>
      </div>

      <div className="options-button-group">
        <button
          className={displayValue === "hex" ? "active" : undefined}
          onClick={() => setDisplayValue("hex")}
        >
          Hex
        </button>
        <button
          className={displayValue === "rgb" ? "active" : undefined}
          onClick={() => setDisplayValue("rgb")}
        >
          Rgb
        </button>
        <button
          className={displayValue === "hsl" ? "active" : undefined}
          onClick={() => setDisplayValue("hsl")}
        >
          Hsl
        </button>
        <button
          className={displayValue === "lch" ? "active" : undefined}
          onClick={() => setDisplayValue("lch")}
        >
          Lch
        </button>
        <button
          className={displayValue === "title" ? "active" : undefined}
          onClick={() => setDisplayValue("title")}
        >
          Name
        </button>
        <button
          className={displayValue === "contrast" ? "active" : undefined}
          onClick={() => setDisplayValue("contrast")}
        >
          Contrast
        </button>

        <button
          className={displayValue === "css" ? "active" : undefined}
          onClick={() => setDisplayValue("css")}
        >
          CSS
        </button>
      </div>
    </div>
  );
}
