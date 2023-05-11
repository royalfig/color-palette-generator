import Button from "./buttons/Button";
import "../css/LaunchPad.css";
import {
  MoonStars,
  Sun,
  Share,
  Clipboard,
  FileArrowDown,
} from "react-bootstrap-icons";
import { useState } from "react";
import { toast } from "react-toastify";

export default function LaunchPad() {
  const [darkMode, setDarkMode] = useState(false);

  function toggleDarkMode() {
    const dark = !darkMode;
    setDarkMode((value) => !value);
    const newMode = dark ? "dark" : "light";
    document.documentElement.dataset.mode = newMode;
  }

  async function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        toast("Link copied to clipboard");
      },
      () => {
        toast("Something went wrong. Try again.");
      }
    );
  }

  return (
    <div className="launchpad">
      <Button type="icon-btn">
        <Clipboard />
      </Button>

      <Button type="icon-btn">
        <FileArrowDown />
      </Button>

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
