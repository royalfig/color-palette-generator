import { sizing } from "@mui/system";
import "../css/Circle.css";
export default function Circle({ colors }) {
  return (
    <div className="circle">
      <svg viewBox="-100 -100 200 200">
        <circle
          cx="0"
          cy="0"
          r="80"
          fill="none"
          stroke="black"
          strokeWidth="1"
        />

        {colors.map((color, idx) => {
          const [h, s] = color.point;

          const hRadians = (h * Math.PI) / 180;
          const sRadians = s;

          const x = sRadians * Math.sin(hRadians);
          const y = sRadians * Math.cos(hRadians);
          console.log({ h, s, x, y });

          const xr = x;
          const yr = y * -1;

          return (
            <circle key={idx} cx={xr} cy={yr} r="20" fill={color.hex}></circle>
          );
        })}
      </svg>
    </div>
  );
}
