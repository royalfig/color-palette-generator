import "../css/Controls.css";
import { BracesAsterisk, Palette, Share } from "react-bootstrap-icons";
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

  async function share() {
    const data = {
      title: "Color Palette Pro",
      text: `${palette}`,
      url: window.location.href,
    };

    try {
      await navigator.share(data);
      toast("Shared");
    } catch (e) {
      toast("something went wrong");
    }
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
        <button className="icon-button" onClick={share}>
          <Share />
        </button>
      </div>
      <p className="palette-name">{palette}</p>
    </div>
  );
}
