import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "react-bootstrap-icons";
import "../../css/Shades.css";
import { ArticleData } from "../../util/ArticleData";
import Specs from "./Specs";
import { SampleNavbar } from "./SampleNavbar";
export default function Shades() {
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
      <div ref={container}>
        <SampleNavbar name="Shades & Tints" handler={handleSpecOverlay} />
        <div className="shades-hero">
          <p
            className="shades-title"
            data-property="color"
            data-value="var(--tas-og-2)"
            data-name="Text color"
          >
            One color
            <br />
            is all it takes
          </p>
          <div>
            <div
              className="shades-shape"
              data-property="background-color"
              data-value="var(--tas-og-8)"
              data-name="Shape color"
            >
              {" "}
            </div>
            <p className="shades-subtitle">10 Shades of Green Green</p>
          </div>
        </div>
        <div className="shades-cta">
          <p
            data-property="background-color"
            data-value="var(--tas-og-2)"
            data-name="Background color"
          >
            Isn't this so much fun? Keep the color train going...
          </p>
          <a
            href="#"
            data-property="background-color"
            data-value="var(--tas-og-5)"
            data-name="Button color"
          >
            Show me some green
          </a>
          <p>Support this project</p>
        </div>
        <div className="shades-card-container">
          {ArticleData.map((article, idx) => {
            return (
              <article className="shades-card" key={idx}>
                <img src={article.image} alt={article.alt} />
                <div className="shades-card-body">
                  <div className="shades-card-title">{article.title}</div>
                  <div className="shades-card-excerpt">{article.excerpt}</div>
                  <a href={article.url} className="shades-card-url">
                    Read <ArrowRight />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
