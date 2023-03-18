import { Eyeglasses } from "react-bootstrap-icons";

export function SampleNavbar({ name, handler }) {
  return (
    <nav className="sample-navbar">
      <ul>
        <li>{name}</li>
      </ul>
      <button onClick={handler}>
        <Eyeglasses /> Specs
      </button>
    </nav>
  );
}
