import "../css/Circle.css";
function sizer(num, size) {
  if (size === "large") {
    return num;
  }

  return num / 2;
}

export default function Circle({ colors, type, size }) {
  const className = size === "large" ? "large circle" : "small circle";

  return (
    <div className={className}>
      <svg viewBox={size === "large" ? "-120 -120 240 240" : "-60 -60 120 120"}>
        <circle
          cx="0"
          cy="0"
          r={sizer(100, size)}
          fill="none"
          stroke="var(--border-1)"
          strokeWidth="3"
        />
        {type !== "circle"
          ? colors.variations[0].map((color, idx) => {
              const [h, s] = color.point;

              const hRadians = (h * Math.PI) / 180;
              const sRadians = sizer(s, size);

              const x = sRadians * Math.sin(hRadians);
              const y = sRadians * Math.cos(hRadians);

              const xr = x;
              const yr = y * -1;

              return (
                <circle
                  key={idx}
                  cx={xr}
                  cy={yr}
                  r={sizer(20, size)}
                  fill={color.hex}
                ></circle>
              );
            })
          : colors.variations[0].map((color, idx) => {
              const h = sizer((idx + 10) * (size === "large" ? 36 : 72), size);

              const hRadians = (h * Math.PI) / 180;
              const sRadians = sizer(50, size);

              const x = sRadians * Math.sin(hRadians);
              const y = sRadians * Math.cos(hRadians);

              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r={sizer(20, size)}
                  fill={color.hex}
                ></circle>
              );
            })}
      </svg>
    </div>
  );
}
