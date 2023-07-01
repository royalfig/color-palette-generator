import { ClockHistory } from "react-bootstrap-icons";
import "./ColorHistory.css";
import { useContext } from "react";
import { ColorContext } from "../ColorContext";

export default function ColorHistory({ colorHistory }) {
  const colors = useContext(ColorContext);

  while (colorHistory.length < 3) {
    colorHistory.push("");
  }
  console.log(
    "🚀 ~ file: ColorHistory.jsx:10 ~ ColorHistory ~ colorHistory:",
    colorHistory
  );

  return (
    <div className="color-history">
      <ClockHistory />
      {colorHistory.map((color, index) => {
        if (color === "") {
          return <div key={index} className="color-history-item"></div>;
        } else {
          return (
            <button
              key={index}
              className="color-history-item"
              style={{ backgroundColor: color }}
              onClick={() => colors.setColor(color)}
              aria-label={`Set color to ${color}`}
            ></button>
          );
        }
      })}
    </div>
  );
}
