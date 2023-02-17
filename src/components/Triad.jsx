import {
  ArrowBarRight,
  ArrowDownRightCircleFill,
  ArrowRight,
} from "react-bootstrap-icons";
import "../css/Triad.css";
import { SampleNavbar } from "./SampleNavbar";

export default function Triad({ props }) {
  return (
    <div className="triad-container">
      <SampleNavbar name="Triadic"></SampleNavbar>
      <div className="triad-hero">
        <div className="triad-hero-left">
          <div className="triad-title">
            <p>For</p>
            <p>Three</p>
            <div className="triad-basketball shadow"></div>
          </div>
        </div>
        <div className="triad-hero-right">
          <div className="triad-top"></div>
          <div className="triad-bottom">
            <p>
              Three points on the color wheel, 120&deg; away from each other.{" "}
            </p>
          </div>
        </div>
      </div>
      <div className="triad-catchline">
        <p>The Steph Curry of Color Palettes</p>
      </div>
      <div className="triad-card-container">
        <article className="triad-card">
          <header>Relative luminance: tl:dr;</header>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis
            deserunt quae eos delectus recusandae nobis amet sed eaque earum
            neque commodi quia ab consectetur labore, eveniet aspernatur
            possimus fuga? Est.
          </p>
          <a href="#">
            <span>Read</span>
            <ArrowRight />
          </a>
        </article>
        <article className="triad-card">
          <header>HSL is a liar</header>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis
            deserunt quae eos delectus recusandae nobis amet sed eaque earum
            neque commodi quia ab consectetur labore, eveniet aspernatur
            possimus fuga? Est.
          </p>
          <a href="#">
            <span>Read</span>
            <ArrowRight />
          </a>
        </article>
        <article className="triad-card">
          <header>Browsers are dull</header>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis
            deserunt quae eos delectus recusandae nobis amet sed eaque earum
            neque commodi quia ab consectetur labore, eveniet aspernatur
            possimus fuga? Est.
          </p>
          <a href="#">
            <span>Read</span>
            <ArrowRight />
          </a>
        </article>
      </div>
      <footer className="triad-footer">
        <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p>{" "}
        <p>stat</p>
      </footer>
    </div>
  );
}
