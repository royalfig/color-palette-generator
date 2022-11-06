import "../css/Navbar.css";
import {
  BracesAsterisk,
  Lightbulb,
  Palette,
  MoonStars,
  Sun,
  Share,
} from "react-bootstrap-icons";

export default function Navbar() {
  const dark = null;
  const corrected = false;
  const selected = false;
  function handleCorrected() {}
  return (
    <nav className="navbar">
      <div className="left">
        <h1>Color Palette Pro</h1>
      </div>

      <div className="right">
        <button className="icon-button">
          <BracesAsterisk />
        </button>
        <button className="icon-button">
          <Palette />
        </button>
        <button className="icon-button">
          {dark ? <Sun /> : <MoonStars />}
        </button>
        <button className="icon-button">
          <Share />
        </button>
      </div>
    </nav>
  );
}
