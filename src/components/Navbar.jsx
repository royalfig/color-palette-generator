import "../css/Navbar.css";
import { MoonStars, Sun, Share } from "react-bootstrap-icons";

export default function Navbar({ setDarkMode, darkMode, css }) {
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
    <nav className="navbar">
      <div className="left">
        <h1>Color Palette Pro</h1>
        <div className="links">
          <button>About</button>
          <button>Help</button>
        </div>
      </div>

      <div className="right">
        <button className="icon-text-button" onClick={setDarkMode}>
          {darkMode ? <Sun /> : <MoonStars />}{" "}
          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>
        {navigator.canShare ? (
          <button className="icon-text-button" onClick={handleShare}>
            <Share /> <span>Share</span>
          </button>
        ) : (
          ""
        )}
      </div>
    </nav>
  );
}
