import { ArrowRight } from "react-bootstrap-icons";
import { ArticleData } from "./ArticleData";
import { SampleNavbar } from "./SampleNavbar";
import "../css/Tetradic.css";
export default function Tetradic({ props }) {
  return (
    <div className="tetradic">
      <SampleNavbar name="Tetradic" />

      <div className="tetradic-hero">
        <p className="tetradic-title">Is four colors too much!?</p>
        <p className="tetradic-subtitle">
          The tetradic color palette leaves no color behind. It starts at the
          principal color and moves around the wheel at 90&deg; intervals.
        </p>
        <a href="#" className="tetradic-cta">
          Fund the study
        </a>
      </div>
      <div className="tetradic-card-container">
        {ArticleData.map((article) => {
          return (
            <article className="tetradic-card">
              <p className="tetradic-card-title">{article.title}</p>
              <img src={article.image} alt={article.alt} />
              <p className="article excerpt">{article.excerpt}</p>
              <a href={article.url} className="tetradic-link">
                Read <ArrowRight />
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
