import { slugify } from "./Sample";

export function SampleNavbar({ name }) {
  return (
    <nav className="sample-navbar">
      <ul>
        <li>{name}</li>
        <li>About</li>
        <li>Xyz</li>
      </ul>
      <button>{slugify(name)}</button>
    </nav>
  );
}
