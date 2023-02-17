import "../css/Shades.css";
import { SampleNavbar } from "./SampleNavbar";
export default function Shades() {
  return (
    <>
      <SampleNavbar name="Shades & Tints" />
      <div className="shades-hero">
        <p className="shades-title">One color is all it takes</p>
        <div>
          <div className="shades-shape"></div>
          <p className="shades-subtitle">10 Shades of Green Green</p>
        </div>
      </div>
      <div className="shades-cta">
        <p>Isn't this so much fun? Keep the color train going...</p>
        <a href="#">Show me some green</a>
        <p>Support this project</p>
      </div>
    </>
  );
}
