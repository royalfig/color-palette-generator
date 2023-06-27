import { useEffect, useState } from "react";
import { ArrowClockwise } from "react-bootstrap-icons";
import "./colorTextInput.css"

export default function ColorTextInput({ label, value, loading }) {
  const id = label.toLowerCase();
  const [state, setState] = useState(value);

  useEffect(() => {
    setState(value);
  }, [value]);
  return (
    <div>
      <label htmlFor={id} className="color-selector-text-input-label">
        {label} {loading && <ArrowClockwise className="color-selector-text-loader"/>}
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
