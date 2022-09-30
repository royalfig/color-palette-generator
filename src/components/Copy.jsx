import "../css/Copy.css";
import toast from "react-hot-toast";

export default function Copy({ text }) {
  function clickHandler() {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${text} copied to clipboard`);
      },
      () => {}
    );
  }

  return (
    <>
      <button className="ctc" onClick={clickHandler}>
        {text}
      </button>
    </>
  );
}
