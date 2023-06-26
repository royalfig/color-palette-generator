import { useEffect, useState } from "react";

export default function ColorTextInput({ label, value }) {
  const id = label.toLowerCase();
  const [state, setState] = useState(value);

  useEffect(() => {
    setState(value);
  }, [value]);
  return (
    <div>
      <label htmlFor={id} className="color-selector-text-input-label">
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={state}
        onChange={(e) => setState(e.target.value)}
        spellCheck="false"
      />
    </div>
  );
}
