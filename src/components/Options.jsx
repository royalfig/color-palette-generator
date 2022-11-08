import "../css/Options.css";
export default function Options() {
  const selected = "hex";
  return (
    <div className="options">
      <div className="gradient-heading">
        <h2>Pick Your Value</h2>
        <div className="gradients">
          <div className="gradient"></div>
          <div className="gradient"></div>
          <div className="gradient"></div>
        </div>
      </div>

      <div className="options-button-group">
        <button
          className={selected === "hex" ? "active" : undefined}
          onClick={() => setSelected("hex")}
        >
          Hex
        </button>
        <button
          className={selected === "rgb" ? "active" : undefined}
          onClick={() => setSelected("rgb")}
        >
          Rgb
        </button>
        <button
          className={selected === "hsl" ? "active" : undefined}
          onClick={() => setSelected("hsl")}
        >
          Hsl
        </button>
        <button
          className={selected === "lch" ? "active" : undefined}
          onClick={() => setSelected("lch")}
        >
          Lch
        </button>
        <button
          className={selected === "name" ? "active" : undefined}
          onClick={() => setSelected("name")}
        >
          Name
        </button>
        <button
          className={selected === "contrast" ? "active" : undefined}
          onClick={() => setSelected("contrast")}
        >
          Contrast
        </button>
      </div>
    </div>
  );
}
