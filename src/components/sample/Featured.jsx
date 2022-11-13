import lights from "../../assets/lights.jpg";
import boredom from "../../assets/boredom.jpg";
import lies from "../../assets/lies.jpg";

export default function Featured({ palette }) {
  return (
    <section className={palette + "-featured"}>
      <div className={palette + "-featured-inner"}>
        <article className={palette + "-featured-card"}>
          <div className={palette + "-featured-image"}>
            <img src={lights} alt="" />
          </div>
          <div>
            <h3>Relative luminance: a TL;DR</h3>
            <p>Some colors appear brighter to the human mind.</p>
          </div>
        </article>
        <article className={palette + "-featured-card"}>
          <div className={palette + "-featured-image"}>
            <img src={lies} alt="" />
          </div>
          <div>
            <h3>HSL is a liar</h3>
            <p>Lightness isn't always lightness</p>
          </div>
        </article>
        <article className={palette + "-featured-card"}>
          <div className={palette + "-featured-image"}>
            <img src={boredom} alt="" />
          </div>
          <div>
            <h3>The browser is dull</h3>
            <p>It's hiding happiness from you</p>
          </div>
        </article>
      </div>
    </section>
  );
}
