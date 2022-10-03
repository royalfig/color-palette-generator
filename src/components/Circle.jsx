import "../css/Circle.css";
export default function Circle({ colors, type }) {
  return (
    <div className="circle">
      <svg viewBox="-120 -120 240 240">
        <circle
          cx="0"
          cy="0"
          r="100"
          fill="none"
          stroke="rgb(0 0 0 /.5)"
          strokeWidth="3"
        />
        {type !== "circle"
          ? colors.map((color, idx) => {
              const [h, s] = color.point;

              const hRadians = (h * Math.PI) / 180;
              const sRadians = s;

              const x = sRadians * Math.sin(hRadians);
              const y = sRadians * Math.cos(hRadians);

              const xr = x;
              const yr = y * -1;

              return (
                <circle
                  key={idx}
                  cx={xr}
                  cy={yr}
                  r="20"
                  fill={color.hex}
                ></circle>
              );
            })
          : colors.map((color, idx) => {
              const h = (idx + 10) * 36;

              const hRadians = (h * Math.PI) / 180;
              const sRadians = 50;

              const x = sRadians * Math.sin(hRadians);
              const y = sRadians * Math.cos(hRadians);

              const xr = x;
              const yr = y * -1;

              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="20"
                  fill={color.hex}
                ></circle>
              );
            })}
      </svg>
    </div>
  );
}
