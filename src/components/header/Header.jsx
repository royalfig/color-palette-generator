import Button from "../button/Button";
import "./Header.css";

import { copy } from "../../util/copy";

export default function Header({ h2, text, children }) {
  return (
    <header className="header">
      <h2>
        {children} {h2}
      </h2>
      <div>
        <Button type="text" handler={copy.bind(null, text)}>
          {text}
        </Button>
      </div>
    </header>
  );
}
