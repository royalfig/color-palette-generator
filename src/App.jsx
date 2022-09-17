import { useState } from "react";

import Color from "./components/Color";
import "./App.css";
import {
  createAdjacent,
  createComplement,
  createTetrad,
  createTriad,
} from "./util";

function App() {
  const [color, setColor] = useState("#ff0000");
  const [corrected, setCorrected] = useState(false);
  const complement = createComplement(color);
  const adjacent = createAdjacent(color);
  const triad = createTriad(color);
  const tetrad = createTetrad(color);

  function handleChange(e) {
    setColor(e.target.value);
  }

  function toggleY(e) {
    setCorrected(e.target.corrected);
  }

  return (
    <div className="App">
      <input type="color" onChange={handleChange} value={color}></input>
      <input type="checkbox" onChange={toggleY}></input>

      <Color color={complement} corrected />
      <Color color={adjacent} corrected />
      <Color color={triad} corrected />
      <Color color={tetrad} corrected />
    </div>
  );
}

export default App;
