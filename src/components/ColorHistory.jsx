export default function ColorHistory({ colorHistory, setColor }) {
  return (
    <div className="color-history">
      {colorHistory.map((color, index) => (
        <div
          key={index}
          className="color-history-item"
          style={{ backgroundColor: color }}
          onClick={() => setColor(color)}
        ></div>
      ))}
    </div>
  );
}
