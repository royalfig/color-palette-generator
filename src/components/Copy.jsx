import "../css/Copy.css";
import toast from "react-hot-toast";
import { Clipboard2Check } from "react-bootstrap-icons";

export default function Copy({ text }) {
  function clickHandler() {
    navigator.clipboard.writeText(text).then(() => {
      toast(`"${text}" copied to clipboard`, {
        icon: "📋",
      });
    });
  }

  return (
    <>
      <button className="ctc" onClick={clickHandler}>
        {text}
      </button>
    </>
  );
}
