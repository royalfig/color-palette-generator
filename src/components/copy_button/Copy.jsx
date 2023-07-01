import "./copy.css";
import { toast } from "react-toastify";

export default function Copy({ text }) {
  function clickHandler() {
    navigator.clipboard.writeText(text).then(() => {
      toast(
        <div style={{ fontSize: ".8rem" }}>
          <span
            style={{
              textDecoration: `underline ${text} .25em`,
              textUnderlineOffset: "6px",
            }}
          >
            {text}
          </span>{" "}
          copied!
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
