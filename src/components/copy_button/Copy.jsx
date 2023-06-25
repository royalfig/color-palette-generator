import "./copy.css";
import { toast } from "react-toastify";

export default function Copy({ text }) {
  function clickHandler() {
    navigator.clipboard.writeText(text).then(() => {
      toast(
        <div>
          {text} copied to clipboard!
          <span
            style={{
              backgroundColor: text,
              height: "1em",
              width: "1em",
              borderRadius: 50,
              display: "inline-block",
              marginLeft: ".5em",
            }}
          ></span>
        </div>,
        {
          position: "bottom-left",
        }
      );
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
