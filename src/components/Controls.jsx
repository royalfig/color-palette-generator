import "../css/Controls.css";
export default function Controls({ palette }) {
  return (
    <div className="controls">
      <div className="controls-buttons">
        <button>Copy CSS</button>
        <button>Copy Palette</button>
      </div>
      <p className="palette-name">{palette}</p>
    </div>
  );
}
