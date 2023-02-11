import "../../css/Button.css";

export default function Button({ type, handler, children }) {
  console.log(type, handler);
  return (
    <button className={type} onClick={handler}>
      {children}
    </button>
  );
}
