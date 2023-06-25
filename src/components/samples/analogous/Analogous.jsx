import "./analogous.css";
import { ArticleData } from "../../../util/ArticleData";
import { SampleNavbar } from "../SampleNavbar";
import Specs from "../Specs";
import { useState, useRef, useEffect } from "react";

export default function Analogous() {
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

      <div className="analogous" ref={container}>
        <SampleNavbar name="Analogous" handler={handleSpecOverlay} />

        <div className="analogous-hero">
          <div className="analogous-title">
            <p>Birds of a Feather</p>
            <p>Birds of a Feather</p>
            <p>Birds of a Feather</p>
          </div>

          <div className="analogous-bird">
            <div
              className="analogous-bird-head"
              data-property="background-color"
              data-value="var(--ana-sb-3)"
              data-name="Background color"
            >
              <div className="analogous-bird-beak"></div>
            </div>
            <div
              className="analogous-bird-body"
              data-property="color"
              data-value="var(--ana-sb-2)"
              data-name="Text"
            ></div>
          </div>
        </div>

        <div
          className="analogous-subtitle"
          data-property="background-color"
          data-value="var(--ana-sb-1)"
          data-name="Background color"
        >
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
    </>
  );
}
