import { ArrowRightCircle } from "react-bootstrap-icons";
import "../css/Split.css";
import { ArticleData } from "./ArticleData";
import { SampleNavbar } from "./SampleNavbar";

export default function Split() {
  return (
    <div className="split">
      <div className="circle-1"></div>
      <div className="circle-2"></div>
      <div className="pill-1"></div>
      <div className="pill-2"></div>
      <div className="pill-3"></div>
      <div className="pill-4"></div>

      <SampleNavbar name="Split Complementary" />

      <div className="split-main">
        <div className="split-hero">
          <div className="split-title-container">
            <p className="split-title">Banana Split</p>

            <p>Like complementary but with a cherry on top.</p>
            <p>
              Your chosen color plus two more shifted 30 degrees from the
              complement.
            </p>

            <a href="#"> Buy me an ice cream</a>
          </div>

          {ArticleData.map((article) => {
            return (
              <article className="split-card" key={article.title}>
                <p className="split-card-title">{article.title}</p>
                <p className="split-card-excerpt">{article.longExcerpt}</p>
                <a href={article.url}>
                  Read <ArrowRightCircle />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
