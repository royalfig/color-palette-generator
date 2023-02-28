import { ArrowRightCircle, X } from "react-bootstrap-icons";
import "../css/Split.css";
import { ArticleData } from "./ArticleData";
import { SampleNavbar } from "./SampleNavbar";
import { useRef, useState } from "react";
import Button from "./buttons/Button";
import Specs from "./Specs";

function cssToJsx(cssProperty) {
  if (!/-/.test(cssProperty)) {
    return cssProperty;
  }

  const [first, second] = cssProperty.split("-");

  return first + second.charAt(0).toUpperCase() + second.slice(1);
}

export default function Split() {
  const circle1 = useRef(null);
  const circle2 = useRef(null);
  const pill1 = useRef(null);
  const pill2 = useRef(null);
  const pill3 = useRef(null);
  const pill4 = useRef(null);
  const cta = useRef(null);
  const hero = useRef(null);
  const card = useRef(null);

  const container = useRef(null);

  const [els, setEls] = useState([]);

  const [specsOn, setSpecsOn] = useState(false);

  function handle() {
    const {
      left: containerL,
      right: containerR,
      top: containerT,
      bottom: containerB,
    } = container.current.getBoundingClientRect();

    let positions = [];

    const data = [
      circle1,
      circle2,
      pill1,
      pill2,
      pill3,
      pill4,
      cta,
      hero,
      card,
    ].map((e, i) => {
      const elementProps = {};
      const element = e.current;
      const { property, value, decorator, name } = e.current.dataset;
      const { top, right, bottom, left } = element.getBoundingClientRect();

      let midX = left + (right - left) / 2;
      let midY = top + (bottom - top) / 2;

      midX = midX + 400 > containerR ? left - 200 : midX;
      midX = midX - 200 < containerL ? left + 100 : midX;
      console.log(midX, containerR);
      elementProps.property = property;
      elementProps.value = value;
      elementProps.styles = {
        background: value.replace(";", ""),
      };

      positions.forEach((pos) => {
        const [t, b, l, r] = pos;

        if (t < midY - containerT < b && l < midX - containerL < r) {
          // console.log(element);
          // midY -= 50;
        }
      });

      positions.push([
        midY - containerT,
        midY - containerT + bottom - top,
        midX - containerL,
        midX - containerL + right - left,
      ]);
      elementProps.position = {
        top: midY - containerT,
        left: midX - containerL,
      };
      elementProps.decoratorShape = decorator;
      elementProps.name = name;
      return elementProps;
    });

    setEls(data);
    setSpecsOn(true);
  }

  function handleCloseButton() {
    setSpecsOn(false);
  }

  return (
    <>
      <div className={specsOn ? "specs-overlay show" : "specs-overlay"}>
        <Button type="icon-btn" handler={handleCloseButton} classes>
          <X height={30} width={30} />
        </Button>

        <div className="specs-elements">
          {els.map((el, idx) => (
            <Specs data={el} key={idx} />
          ))}
        </div>
      </div>

      <div className="split" ref={container}>
        <div
          className="circle-1"
          ref={circle1}
          data-property="background-image"
          data-value="linear-gradient(45deg, hsl(var(--spl-og-3-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="circle"
        ></div>

        <div
          className="circle-2"
          ref={circle2}
          data-property="background-image"
          data-value="linear-gradient(45deg, hsl(var(--spl-og-2-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="circle"
        ></div>

        <div
          className="pill-1"
          ref={pill1}
          data-property="background-image"
          data-value="linear-gradient(-45deg, hsl(var(--spl-og-3-raw) / 25%), transparent);"
          data-decorator="pill"
          data-name="pill"
        ></div>
        <div
          className="pill-2"
          ref={pill2}
          data-property="background-image"
          data-value="linear-gradient(-45deg, hsl(var(--spl-og-2-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="pill"
        ></div>
        <div
          className="pill-3"
          ref={pill3}
          data-property="background-image"
          data-value="linear-gradient(-45deg, hsl(var(--spl-og-1-raw) / 25%), transparent);"
          data-decorator="circle"
          data-name="pill"
        ></div>
        <div
          className="pill-4"
          ref={pill4}
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
                ref={hero}
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
                ref={cta}
                data-property="background-color"
                data-value="var(--surface-3)"
                data-decorator="square"
                data-name="button"
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
                    ref={card}
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
