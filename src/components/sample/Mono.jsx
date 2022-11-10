import "../../css/Mono.css";
import Featured from "./Featured";
import Header from "./Header";
import Nav from "./Nav";
import List from "./List";
import Footer from "./Footer";

export default function Mono() {
  const paletteClassName = { palette: "mono" };

  return (
    <div className="sample-container">
      <Header
        title="It's classy"
        subtitle="It's bougies. It's monochromatic."
        description="10 desaturated versions of the same color in varying lightnesses."
        {...paletteClassName}
      />
    </div>
  );
}
