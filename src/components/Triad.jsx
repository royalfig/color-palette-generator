import { ArrowRight } from "react-bootstrap-icons";
import "../css/Triad.css";
import { SampleNavbar } from "./SampleNavbar";
import { ArticleData } from "./ArticleData";

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
        {ArticleData.map((article, idx) => {
          return (
            <article className="triad-card" key={idx}>
              <header>{article.title}</header>
              <p>{article.longExcerpt}</p>
              <a href={article.url}>
                <span>Read</span>
                <ArrowRight />
              </a>
            </article>
          );
        })}
      </div>
      <footer className="triad-footer">
        <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p>{" "}
        <p>stat</p>
      </footer>
    </div>
  );
}
