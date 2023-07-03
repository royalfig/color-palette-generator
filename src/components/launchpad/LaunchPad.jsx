import { useState } from "react";
import {
  Clipboard,
  FileEarmarkArrowDown,
  MoonStars,
  Share,
  Sun,
  Window,
  Palette,
  Image,
  PlusCircleFill,
  XCircleFill,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import Button from "../button/Button";
import "./LaunchPad.css";

export default function LaunchPad() {
  const [darkMode, setDarkMode] = useState(false);
  const [ui, setUi] = useState(false);
  const [launchpad, setLaunchpad] = useState(false);

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
      {launchpad ? (
        <div className="launchpad-menu">
          <Button type="icon-btn">
            <Clipboard />
          </Button>
          <Button type="icon-btn">
            <Image />
          </Button>
          <Button type="icon-btn">
            <FileEarmarkArrowDown />
          </Button>
          <Button type="icon-btn" handler={() => setUi(!ui)}>
            {ui ? <Window /> : <Palette />}
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
      ) : undefined}

      <Button type="icon-btn" handler={() => setLaunchpad(!launchpad)}>
        {!launchpad ? <PlusCircleFill /> : <XCircleFill />}
      </Button>
    </div>
  );
}
