import "../../css/Comp.css";
import Featured from "./Featured";
import Header from "./Header";
import Nav from "./Nav";
import List from "./List";
import Footer from "./Footer";

export default function Mono() {
  const paletteClassName = { palette: "comp" };

  return (
    <div className="sample-container">
      <Nav title="Complementary" {...paletteClassName} />

      <Header
        title="Double trouble"
        subtitle="It takes two to make a thing feel right."
        description="A primary color plus another color shifted 180&deg; on the color wheel."
        {...paletteClassName}
      />

      <Featured {...paletteClassName} />

      <List {...paletteClassName} />

      <Footer {...paletteClassName} />
    </div>
  );
}
