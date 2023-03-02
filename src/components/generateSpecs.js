export default function generateSpecs(refs, container) {
  const {
    left: containerL,
    right: containerR,
    top: containerT,
  } = container.current.getBoundingClientRect();

  return refs.map((e) => {
    const { current } = e;
    const { property, value, decorator, name } = current.dataset;
    const { top, left, width, height } = current.getBoundingClientRect();
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
