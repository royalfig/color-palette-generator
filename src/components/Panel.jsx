import "../css/Panel.css";

export default function Panel({
  setCorrected,
  corrected,
  selected,
  setSelected,
}) {
  return (
    <div className="panel">
      <div className="panel-left">
        <button
          onClick={() => setCorrected(!corrected)}
          className={corrected ? "active" : undefined}
        >
          Relative luminance
        </button>
        <button>Copy CSS</button>
        <button>Copy Palette</button>
      </div>

      <div className="selected-group">
        <button
          className={selected === "name" ? "active" : undefined}
          onClick={() => setSelected("name")}
        >
          Name
        </button>
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
          className={selected === "contrast" ? "active" : undefined}
          onClick={() => setSelected("contrast")}
        >
          Contrast
        </button>
      </div>
    </div>
  );
}
