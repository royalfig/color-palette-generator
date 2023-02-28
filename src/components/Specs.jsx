export default function Specs({ data }) {
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
