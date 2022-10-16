import "../css/Controls.css";
import { BracesAsterisk, Palette } from "react-bootstrap-icons";
import toast from "react-hot-toast";

export default function Controls({ palette }) {
  function copyToClipboard(arg) {
    const { type, value } = arg;

    if (type === "css") {
      toast("CSS copied to clipboard");
      return;
    }

    toast("palette download");
  }
  return (
    <div className="controls">
      <div className="controls-buttons">
        <button
          className="icon-button"
          onClick={() =>
            copyToClipboard({ type: "css", value: "{color: red}" })
          }
        >
          <BracesAsterisk />
        </button>
        <button
          className="icon-button"
          onClick={() =>
            copyToClipboard({ type: "palette", value: "{color: red}" })
          }
        >
          <Palette />
        </button>
      </div>
      <p className="palette-name">{palette}</p>
    </div>
  );
}
