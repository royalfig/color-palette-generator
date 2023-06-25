import { Github, Twitter } from "react-bootstrap-icons";
import "./navbar.css";

import Button from "../button/Button";
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="left">
          <h1>
            <span style={{ color: "var(--com-og-1)" }}>Color</span> Palette Pro
          </h1>
        </div>
        <div className="right">
          <Button type="text-btn" handler={(e) => console.log(e)}>
            About
          </Button>
          <Button type="text-btn" handler={(e) => console.log(e)}>
            Help
          </Button>
          <a href="" className="icon-btn">
            <Github />
          </a>
          <a href="" className="icon-btn">
            <Twitter />
          </a>
          <p></p>
        </div>
      </div>
    </nav>
  );
}
