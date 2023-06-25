import "./tones.css";
import { ArticleData } from "../../../util/ArticleData";
import { SampleNavbar } from "../SampleNavbar";
import { useEffect, useRef, useState } from "react";
import Specs from "../Specs";

export default function Tones() {
  const [specsOn, setSpecsOn] = useState(false);
  const [elements, setElements] = useState([]);

  // Refs
  const container = useRef(null);

  useEffect(() => {
    const els = container.current.querySelectorAll("[data-name]");
    setElements(Array.from(els));
  }, []);

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
      <div className="tones" ref={container}>
        <SampleNavbar name={"Tones"} handler={handleSpecOverlay} />

        <div className="tones-hero">
          <div className="tones-left">
            <div className="tones-title">
              <div className="tones-subtitle">
                <p>It&apos;s classy. It&apos;s bougies. It&apos;s</p>
                <div></div>
              </div>
              <p
                data-property="background-color"
                data-value="var(--surface-3)"
                data-name="Background"
              >
                Monochromatic
              </p>
              <p>
                Tones of the principal color in a descending scale of lightness.
              </p>
            </div>
            <div
              className="tones-cta"
              data-property="background-color"
              data-value="var(--ton-ke-6)"
              data-name="Button"
            >
              <a href="#">Pony Up</a>
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
              <article
                className="tones-card"
                key={article.title}
                data-property={idx === 0 ? "color" : null}
                data-value={idx === 0 ? "var(--element-1)" : null}
                data-name={idx === 0 ? "Text" : null}
              >
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
    </>
  );
}
