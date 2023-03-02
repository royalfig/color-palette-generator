import "../css/Specs.css";
import Button from "./buttons/Button";
import { X } from "react-bootstrap-icons";

function Spec({ data }) {
  const { decoratorShape, property, value, styles, position, name } = data;
  const decoratorClass = `spec-decorator ${decoratorShape}`;

  return (
    <div className="spec" style={position}>
      <p>{name}</p>
      <div>
        <span className={decoratorClass} style={styles}></span>
        <code>
          <span className="prop">{property}</span>:&nbsp;
          <span className="value">{value}</span>
        </code>
      </div>
    </div>
  );
}

function generateSpecs(refs, container) {
  console.log(container, refs);
  const {
    left: containerL,
    right: containerR,
    top: containerT,
  } = container.current.getBoundingClientRect();

  return refs.map((element) => {
    const { property, value, decorator, name } = element.dataset;
    const { top, left, width, height } = element.getBoundingClientRect();
    let xOnCenter = left - containerL + width / 2;
    let yOnCenter = top - containerT + height / 2;

    // Shift element left or right if it's near the edge
    xOnCenter = xOnCenter + 400 > containerR ? left - 200 : xOnCenter;
    xOnCenter = xOnCenter < containerL ? (xOnCenter += 18) : xOnCenter;

    // Define the object values
    const elementProps = {};
    elementProps.property = property;
    elementProps.value = value;
    elementProps.styles = {
      background: value.replace(";", ""),
    };
    elementProps.position = {
      top: yOnCenter,
      left: xOnCenter,
    };
    elementProps.decoratorShape = decorator;
    elementProps.name = name;
    return elementProps;
  });
}

export default function Specs({ specsOn, setSpecsOn, refs, container }) {
  const data = generateSpecs(refs, container);

  function handleCloseButton() {
    setSpecsOn(false);
  }

  return (
    <div className={specsOn ? "specs-overlay show" : "specs-overlay"}>
      <Button type="icon-btn" handler={handleCloseButton} classes>
        <X height={30} width={30} />
      </Button>

      <div className="specs-elements">
        {data.map((el, idx) => (
          <Spec data={el} key={idx} />
        ))}
      </div>
    </div>
  );
}
