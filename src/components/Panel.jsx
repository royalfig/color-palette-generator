import "../css/Panel.css";
import {
  BracesAsterisk,
  Lightbulb,
  LightbulbFill,
  Palette,
  MoonStars,
  Sun,
} from "react-bootstrap-icons";
import toast from "react-hot-toast";

export default function Panel({
  setCorrected,
  corrected,
  selected,
  setSelected,
}) {
  let dark = false;

  function handleCorrected() {
    setCorrected(!corrected);
    const state = !corrected ? "enabled" : "disabled";
    toast(`Relative luminance ${state}`, { icon: "💡" });
  }

  return (
    <div className="panel">
      <div className="panel-left">
        <button
          onClick={handleCorrected}
          className={corrected ? "active icon-button" : "icon-button"}
        >
          {corrected ? <LightbulbFill /> : <Lightbulb />}
        </button>
        <button className="icon-button">
          <BracesAsterisk />
        </button>
        <button className="icon-button">
          <Palette />
        </button>
        <button className="icon-button">
          {dark ? <Sun /> : <MoonStars />}
        </button>
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
