export default function ColorInputs({}) {
  return (
    <section className="color-input-text">
      <div>
        <label htmlFor="hex" className="color-selector-text-input-label">
          HEX
        </label>
        <input
          value={hex}
          onChange={(e) => parseColor(e, "hex")}
          onBlur={() => setHex(color)}
        />
      </div>
      <div>
        <label htmlFor="rgb" className="color-selector-text-input-label">
          RGB
        </label>
        <input
          type="text"
          id="rgb"
          value={rgb}
          onChange={(e) => parseColor(e, "rgb")}
          onBlur={() =>
            setRgb(currentColor.to("srgb").toString({ precision: 2 }))
          }
        />
      </div>
      <div>
        <label htmlFor="hsl" className="color-selector-text-input-label">
          HSL
        </label>
        <input
          type="text"
          id="hsl"
          value={hsl}
          onChange={(e) => parseColor(e, "hsl")}
          onBlur={() =>
            setHsl(currentColor.to("hsl").toString({ precision: 2 }))
          }
        />
      </div>
      <div>
        <label htmlFor="lch" className="color-selector-text-input-label">
          LCH
        </label>
        <input
          type="text"
          id="lch"
          value={lch}
          onChange={(e) => parseColor(e, "lch")}
        />
      </div>
      {validationError ? <p>{validationError}</p> : <p></p>}
    </section>
  );
}
