import { ArrowDownRightCircle } from "react-bootstrap-icons";
import light from "../assets/lights.jpg";

export default function Complementary() {
  return (
    <>
      <div className="complementary-hero">
        <p>Double Trouble</p>
        <p>It takes two to make a thing feel right.</p>
        <p>A primary color plus another shifted 180&deg; on the color wheel.</p>

        <a href="#">Show me some green.</a>
        <p>Support this project</p>
      </div>

      <div className="complementary-card-container">
        <article className="complementary-card">
          <img src={light} alt="" />
          <div className="complementary-card-body">
            <p className="complementary-card-title">
              Relative Luminance: A TL;DR
            </p>
          </div>
          <div className="complementary-card-icon">
            <ArrowDownRightCircle />
          </div>
        </article>
      </div>
    </>
  );
}
