import Button from "./buttons/Button";
import "../css/LaunchPad.css";
import { MoonStars, Sun, Share } from "react-bootstrap-icons";
import { useState } from "react";
export default function LaunchPad({ props }) {
  const [darkMode, setDarkMode] = useState(false);

  function toggleDarkMode() {
    const dark = !darkMode;
    setDarkMode((value) => !value);
    const newMode = dark ? "dark" : "light";
    document.documentElement.dataset.mode = newMode;
  }

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

  return (
    <div className="launchpad">
      <Button
        type="icon-btn"
        handler={toggleDarkMode}
        aria-label={darkMode ? "Toggle dark mode" : "Toggle light mode"}
      >
        {darkMode ? <Sun /> : <MoonStars />}
      </Button>

      <Button type="icon-btn" handler={handleShare}>
        <Share />
      </Button>
    </div>
  );
}
