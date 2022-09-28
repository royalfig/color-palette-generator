import "../css/Controls.css";
export default function Controls({ palette }) {
  return (
    <div className="controls">
      <p className="palette-name">{palette}</p>
    </div>
  );
}
