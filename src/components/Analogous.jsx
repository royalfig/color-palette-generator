import "../css/Analogous.css";
import { ArticleData } from "./ArticleData";
import { SampleNavbar } from "./SampleNavbar";

export default function Analogous({ props }) {
  return (
    <div className="analogous">
      <SampleNavbar name="Analogous" />

      <div className="analogous-hero">
        <div className="analogous-title">
          <p>Birds of a Feather</p>
          <p>Birds of a Feather</p>
          <p>Birds of a Feather</p>
        </div>

        <div className="analogous-bird">
          <div className="analogous-bird-head">
            <div className="analogous-bird-beak"></div>
          </div>
          <div className="analogous-bird-body"></div>
        </div>
      </div>

      <div className="analogous-subtitle">
        <p>These colors stick together.</p>
        <p>
          A principal color flanked by two colors thirty degrees away on the
          color wheel.
        </p>
      </div>

      <div className="analogous-card-container">
        {ArticleData.map((article, idx) => {
          return (
            <article className="analogous-card" key={idx}>
              <a href={article.url}>
                <img src={article.image} alt={article.alt} />
                <div className="analogous-card-body">
                  <p>{article.title}</p>
                </div>
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
