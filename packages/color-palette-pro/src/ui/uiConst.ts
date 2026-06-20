import { SurfaceTreatment, PaletteStyle } from "../types/types";

export const DEFAULT_TREATMENT: SurfaceTreatment = {
  surfaceChromaScale: 1,
  containerChromaScale: 1,
  minProximityBoost: 0,
  outlineContrast: 0,
  elevationSpread: 1,
  stackLShiftDark: 0,
  stackLShiftLight: 0,
  shadowProfile: "soft",
};

// surfaceChromaScale multiplies a deliberately small base (0.012), so it needs large values to
// move the page canvas a perceptible amount once the pole-damping takes its cut — circle/diamond
// run high so their surfaces read as genuinely toned, not just "technically non-zero". square +
// triangle stay at 0 (neutral page) by design; triangle differs from square only in containers.
export const SURFACE_TREATMENT: Record<PaletteStyle, SurfaceTreatment> = {
  square: {
    surfaceChromaScale: 0,
    containerChromaScale: 0,
    minProximityBoost: 0,
    outlineContrast: 0,
    elevationSpread: 1,
    stackLShiftDark: 0,
    stackLShiftLight: 0,
    shadowProfile: "soft",
  },
  triangle: {
    surfaceChromaScale: 0,
    containerChromaScale: 1.0,
    minProximityBoost: 0,
    outlineContrast: 0,
    elevationSpread: 1,
    stackLShiftDark: 0,
    stackLShiftLight: 0,
    shadowProfile: "soft",
  },
  circle: {
    surfaceChromaScale: 3.5,
    containerChromaScale: 1.8,
    minProximityBoost: 0.12,
    outlineContrast: 0.03,
    elevationSpread: 1.15,
    stackLShiftDark: 0,
    stackLShiftLight: -0.012,
    shadowProfile: "soft",
  },
  diamond: {
    surfaceChromaScale: 7.5,
    containerChromaScale: 3.0,
    minProximityBoost: 0.35,
    outlineContrast: 0.1,
    elevationSpread: 1.5,
    stackLShiftDark: -0.04,
    stackLShiftLight: -0.035,
    shadowProfile: "hard",
  },
};
