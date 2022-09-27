import "../css/Controls.css";
export default function Controls({ selected, setSelected, palette }) {
  const handleSelect = (e) => {
    setSelected(e.target.value);
  };

  return (
    <div className="controls">
      <div className="select">
        <select value={selected} onChange={handleSelect}>
          <option value="name">Name</option>
          <option value="hex">Hex</option>
          <option value="rgb">Rgb</option>
          <option value="hsl">Hsl</option>
          <option value="lch">Lch</option>
          <option value="contrast">Contrast</option>
          <option value="y">Luminance</option>
        </select>
      </div>

      <p className="palette-name">{palette}</p>
    </div>
  );
}
