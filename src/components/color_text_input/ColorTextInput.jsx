export default function ColorTextInput({ label, value, parseColor }) {
  const id = label.toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="color-selector-text-input-label">
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => parseColor(e, id)}
        spellCheck="false"
      />
    </div>
  );
}
