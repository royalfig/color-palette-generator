import "../../css/Sample.css";
import { useState } from "react";
import SampleDisplay from "./SampleDisplay";

const titleText = {
  complement: { description: "It takes two", name: "Complementary" },
  adjacent: { description: "Thick as thieves", name: "Adjacent" },
  triad: { description: "Did someone say thruple?", name: "Triadic" },
  tetrad: { description: "Four play", name: "Tetradic" },
  tints: { description: "One color's all it takes", name: "Tints & Shades" },
  mono: { description: "It's classy", name: "Monochromatic" },
  split: { description: "Splitsville.", name: "Split Complementary" },
};

export default function Sample({ selectedPalette }) {
  return (
    <div className="sample-container">
      <div className="header">
        <h2>Example</h2>
        <div className="gradients">
          <div className="gradient"></div>
          <div className="gradient"></div>
          <div className="gradient"></div>
        </div>
      </div>
      <SampleDisplay selectedPalette={selectedPalette[0].name} />
    </div>
  );
}
