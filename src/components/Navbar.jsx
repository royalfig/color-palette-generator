import "../css/Navbar.css";
import { MoonStars, Sun, Share } from "react-bootstrap-icons";

export default function Navbar({ setDarkMode, darkMode, css }) {
  function handleCss() {
    console.log(css);
  }

  return (
    <nav className="navbar">
      <div className="left">
        <h1>Color Palette Pro</h1>
      </div>

      <div className="right">
        <button className="icon-button" onClick={setDarkMode}>
          {darkMode ? <Sun /> : <MoonStars />}
        </button>
        <button className="icon-button">
          <Share />
        </button>
      </div>
    </nav>
  );
}
