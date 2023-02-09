import "../css/Navbar.css";
import { useState } from "react";
import { MoonStars, Sun, Share } from "react-bootstrap-icons";

export default function Navbar({ css }) {
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
            <button>About</button>
            <button>Help</button>
          </div>
        </div>
        <div className="right">
          <button className="icon-text-button" onClick={toggleDarkMode}>
            {darkMode ? <Sun /> : <MoonStars />}{" "}
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          {navigator.canShare || true ? (
            <button className="icon-text-button" onClick={handleShare}>
              <Share /> <span>Share</span>
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
    </nav>
  );
}
