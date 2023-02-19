import { Eyeglasses } from "react-bootstrap-icons";

export function SampleNavbar({ name }) {
  return (
    <nav className="sample-navbar">
      <ul>
        <li>{name}</li>
        <li>About</li>
        <li>Xyz</li>
      </ul>
      <button>
        <Eyeglasses /> Specs
      </button>
    </nav>
  );
}
