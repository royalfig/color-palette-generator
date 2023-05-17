export default function ColorInput({
  label,
  value,
  parseColor,
  setColor,
  currentColor,
}) {
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
        onBlur={() =>
          setColor(currentColor.to("srgb").toString({ precision: 3 }))
        }
      />
    </div>
  );
}
