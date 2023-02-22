import "../css/Navbar.css";
import { useState } from "react";
import { MoonStars, Sun, Share } from "react-bootstrap-icons";
import Button from "./buttons/Button";
export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);

  async function handleShare() {
    const shareData = {
      title: "Color Palette Pro",
      text: "Look at the pretty colors",
      url: window.location.href,
    };

    try {
      await navigator.share(shareData);
    } catch (err) {
      console.error("problem sharing");
    }
  }

  function toggleDarkMode() {
    const dark = !darkMode;
    setDarkMode((value) => !value);
    const newMode = dark ? "dark" : "light";
    document.documentElement.dataset.mode = newMode;
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="left">
          <h1>Color Palette Pro</h1>
          <div className="links">
            <Button type="text-btn" handler={(e) => console.log(e)}>
              About
            </Button>
            <Button type="text-btn" handler={(e) => console.log(e)}>
              Help
            </Button>
          </div>
        </div>
        <div className="right">
          <Button type="text-icon-btn" handler={toggleDarkMode}>
            {darkMode ? <Sun /> : <MoonStars />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>

          {navigator.canShare || true ? (
            <Button type="text-icon-btn" handler={handleShare}>
              <Share />
              Share
            </Button>
          ) : (
            ""
          )}
        </div>
      </div>
    </nav>
  );
}
