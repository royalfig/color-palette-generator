import "../css/Panel.css";

export default function Panel({ setCorrected, corrected }) {
  return (
    <div className="panel">
      <div className="y-selector">
        <input
          id="y"
          type="checkbox"
          onChange={setCorrected}
          checked={corrected}
        />
        <label htmlFor="y">Enable relative luminance</label>
      </div>
      <div className="css-copy">
        <button>Copy CSS</button>
      </div>
    </div>
  );
}
