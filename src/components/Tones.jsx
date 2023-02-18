import "../css/Tones.css";
import { ArticleData } from "./ArticleData";
import { SampleNavbar } from "./SampleNavbar";

export default function Tones({ props }) {
  return (
    <div className="tones">
      <SampleNavbar name={"Tones"} />

      <div className="tones-hero">
        <div className="tones-left">
          <div className="tones-title">
            <div className="tones-subtitle">
              <p>It's classy. It's bougies. It's</p>
              <div></div>
            </div>
            <p>Monochromatic</p>
            <p>
              Tones of the principal color in a descending scale of lightness.
            </p>
          </div>
          <div className="tones-cta">
            <a href="#">Show me the green</a>
          </div>
        </div>
        <div className="tones-right">
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
          <div className="tones-deco"></div>
        </div>
      </div>

      <div className="tones-card-container">
        {ArticleData.map((article, idx) => {
          return (
            <article className="tones-card" key={article.title}>
              <a href={article.url} className="tones-card-link">
                <p className="tones-card-number">{`0${idx + 1}`}</p>
                <p className="tones-card-title">{article.title}</p>
                <p className="tones-card-excpert">{article.longExcerpt}</p>
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
