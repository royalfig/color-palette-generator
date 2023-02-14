import "../../css/Button.css";

export default function Button({ type, handler, children, classes }) {
  return (
    <button className={type + " " + classes} onClick={handler}>
      {children}
    </button>
  );
}
