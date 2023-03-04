import { ArrowRight } from "react-bootstrap-icons";
import "../css/Triad.css";
import { SampleNavbar } from "./SampleNavbar";
import { ArticleData } from "./ArticleData";
import Specs from "./Specs";
import { useState, useRef, useEffect } from "react";

export default function Triad() {
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

      <div className="triad-container" ref={container}>
        <SampleNavbar name="Triadic" handler={handleSpecOverlay}></SampleNavbar>
        <div className="triad-hero">
          <div className="triad-hero-left">
            <div className="triad-title">
              <p>For</p>
              <p>Three</p>
              <div
                className="triad-basketball shadow"
                data-property="background-image"
                data-value="linear-gradient(var(--tri-la-1), var(--tri-la-2))"
                data-name="Ball color"
              ></div>
            </div>
          </div>
          <div
            className="triad-hero-right"
            data-property="background-color"
            data-value="hsl(var(--tri-og-3-raw) / 10%)"
            data-name="Background color"
          >
            <div className="triad-top"></div>
            <div className="triad-bottom">
              <p>
                Three points on the color wheel, 120&deg; away from each other.{" "}
              </p>
            </div>
          </div>
        </div>
        <div
          className="triad-catchline"
          data-property="color"
          data-value="var(--element-3)"
          data-name="Text"
        >
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
        <footer
          className="triad-footer"
          data-property="background-color"
          data-value="var(--ana-sb-3)"
          data-name="Background color"
        >
          <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p> <p>stat</p>{" "}
          <p>stat</p> <p>stat</p>
        </footer>
      </div>
    </>
  );
}
