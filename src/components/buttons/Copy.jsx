import { Clipboard } from "react-bootstrap-icons";
import { toast } from "react-toastify";

export default function ({ textToCopy }) {
  async function handleClick() {
    try {
      navigator.clipboard.writeText(textToCopy);
      toast(`"${textToCopy}" copied!`, {
        position: toast.POSITION.BOTTOM_LEFT,
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <button className="copy-button" onClick={handleClick} aria-label="Copy">
      <Clipboard />
    </button>
  );
}
