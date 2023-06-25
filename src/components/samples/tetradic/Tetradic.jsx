import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "react-bootstrap-icons";
import "./tetradic.css";
import { ArticleData } from "../../../util/ArticleData";
import { SampleNavbar } from "../SampleNavbar";
import Specs from "../Specs";

export default function Tetradic() {
  const articleProps = [
    "var(--tet-ke-2)",
    "var(--tet-ke-3)",
    "var(--tet-ke-4)",
  ];

  const container = useRef(null);

  const [elements, setElements] = useState([]);
  useEffect(() => {
    const els = container.current.querySelectorAll("[data-name]");
    setElements(Array.from(els));
  }, []);

  const [specsOn, setSpecsOn] = useState(false);

  function handleSpecOverlay() {
    setSpecsOn(true);
  }
  return (
    <>
      {specsOn ? (
        <Specs
          specsOn={specsOn}
          setSpecsOn={setSpecsOn}
          refs={elements}
          container={container}
        />
      ) : (
        ""
      )}
      <div className="tetradic" ref={container}>
        <SampleNavbar name="Tetradic" handler={handleSpecOverlay} />

        <div className="tetradic-hero">
          <p
            className="tetradic-title"
            data-property="background-color"
            data-value="var(--tas-og-1)"
            data-name="Text color"
          >
            Is four colors too much!?
          </p>
          <p
            className="tetradic-subtitle"
            data-property="background-color"
            data-value="var(--tas-la-9)"
            data-name="Background color"
          >
            The tetradic color palette leaves no color behind. It starts at the
            principal color and moves around the wheel at 90&deg; intervals.
          </p>
          <a
            href="#"
            className="tetradic-cta"
            data-property="background-color"
            data-value="var(--tet-ke-1)"
            data-name="Button background color"
          >
            Fund the study
          </a>
        </div>
        <div className="tetradic-card-container">
          {ArticleData.map((article, idx) => {
            return (
              <article
                className="tetradic-card"
                data-property="background-color"
                data-value={articleProps[idx]}
                data-name="Background color"
                key={idx}
              >
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
    </>
  );
}
