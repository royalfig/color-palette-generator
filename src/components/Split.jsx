import { ArrowRightCircle } from "react-bootstrap-icons";
import "../css/Split.css";
import { ArticleData } from "./ArticleData";
import { SampleNavbar } from "./SampleNavbar";
import { useEffect, useRef, useState } from "react";
import Specs from "./Specs";

export default function Split() {
  // Refs
  const container = useRef(null);

  const [elements, setElements] = useState([]);

  useEffect(() => {
    const els = container.current.querySelectorAll("[data-name]");
    setElements(Array.from(els));
  }, []);

  const [specsOn, setSpecsOn] = useState(false);

  function handle() {
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

      <div className="split" ref={container}>
        <div
          className="circle-1"
          data-property="background-image"
          data-value="linear-gradient(45deg, hsl(var(--spl-og-3-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="circle"
        ></div>

        <div
          className="circle-2"
          data-property="background-image"
          data-value="linear-gradient(45deg, hsl(var(--spl-og-2-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="circle"
        ></div>

        <div className="pill-1"></div>
        <div
          className="pill-2"
          data-property="background-image"
          data-value="linear-gradient(-45deg, hsl(var(--spl-og-2-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="pill"
        ></div>
        <div className="pill-3"></div>
        <div
          className="pill-4"
          data-property="background-image"
          data-value="linear-gradient(-45deg, hsl(var(--spl-og-1-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="pill"
        ></div>

        <SampleNavbar name="Split Complementary" handler={handle} />

        <div className="split-main">
          <div className="split-hero">
            <div className="split-title-container">
              <p
                className="split-title"
                data-property="background-image"
                data-value="radial-gradient(hsl(var(--spl-og-1-raw) / 15%), transparent 70%), radial-gradient(hsl(var(--spl-og-2-raw) / 15%), transparent 70%), radial-gradient(hsl(var(--spl-og-3-raw) / 15%), transparent 70%);"
                data-decorator="square"
                data-name="Background"
              >
                Banana Split
              </p>

              <p>Like complementary but with a cherry on top.</p>
              <p>
                Your chosen color plus two more shifted 30 degrees from the
                complement.
              </p>

              <a
                href="#"
                data-property="background-color"
                data-value="var(--surface-3)"
                data-decorator="square"
                data-name="Button & card surface"
              >
                Buy me an ice cream
              </a>
            </div>

            {ArticleData.map((article, idx) => {
              if (idx === 2) {
                return (
                  <article
                    className="split-card"
                    key={article.title}
                    data-property="color"
                    data-value="var(--element-3)"
                    data-decorator="square"
                    data-name="Text"
                  >
                    <p className="split-card-title">{article.title}</p>
                    <p className="split-card-excerpt">{article.longExcerpt}</p>
                    <a href={article.url}>
                      Read <ArrowRightCircle />
                    </a>
                  </article>
                );
              } else {
                return (
                  <article className="split-card" key={article.title}>
                    <p className="split-card-title">{article.title}</p>
                    <p className="split-card-excerpt">{article.longExcerpt}</p>
                    <a href={article.url}>
                      Read <ArrowRightCircle />
                    </a>
                  </article>
                );
              }
            })}
          </div>
        </div>
      </div>
    </>
  );
}
