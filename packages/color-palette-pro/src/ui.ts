import Color from "colorjs.io";
import { BaseColorData, colorFactory } from "./factory";
import { PaletteKinds, ColorFormat, PaletteStyle } from "./types";
import { findOptimalLightness, getMedianChroma, findColorByHue } from "./color-math";
import { cvdDistance } from "./cvd";

// ===== CONTRAST-BASED COLOR GENERATION =====
//
// NOTE on the contrast metric: this module targets WCAG 2.1 ratios (contrastWCAG21). WCAG 2 is
// known to be perceptually inaccurate — it overstates contrast for light-on-dark (dark mode)
// and ignores hue/chroma. APCA (Lc) models this better and is used in code-mode for syntax.
// We keep WCAG 2.1 here because consumers validate against it, but dark-mode "on-*" colors
// chosen to *just* clear 4.5:1 may be perceptually light; prefer the higher AAA tokens for body
// text in dark mode. (Audit 2D.2.)

// ===== SURFACE MATERIAL TREATMENT (per style) =====
//
// The four palette STYLES select how much brand color bleeds into the neutral surface stack
// and how the chrome reads as a material — a monotonic dial from restrained to brutalist:
//
//   square   — neutral baseline: surfaces AND containers carry no brand tint.
//   triangle — neutral surfaces, lightly tinted containers.
//   circle   — lightly toned surfaces, more tinted containers.
//   diamond  — toned surfaces + containers (brutalist), exaggerated elevation steps, harder
//              outline contrast, hard-edged shadows.
//
// Scales multiply the per-role *intended* chroma; the existing pole-damping still applies, so
// light-mode page canvases stay near-white regardless (the tone shows on containers and in
// dark mode, by design). This is the single source of truth for surface material — consumed
// by the UI palette here, and (from a later pass) by code-mode chrome.
export interface SurfaceTreatment {
  /** Multiplier on the page-canvas (surface) intended brand chroma. */
  surfaceChromaScale: number;
  /** Multiplier on container / sunken / overlay intended brand chroma. */
  containerChromaScale: number;
  /** Added to each role's pole-damping floor so the tint survives nearer white/black. */
  minProximityBoost: number;
  /** Extra lightness pushed into outline / outline-variant for crisper, higher-contrast edges. */
  outlineContrast: number;
  /** Multiplier on each elevation tier's ΔL from the surface (>1 widens the stack). */
  elevationSpread: number;
  /** Lightness shift applied to the whole surface stack in dark mode (diamond deepens for depth). */
  stackLShiftDark: number;
  /** Lightness shift for the whole stack in light mode (negative off-whites the page so it can hold a tone — light surfaces near pure white cannot). */
  stackLShiftLight: number;
  /** Shadow rendering: layered penumbra ('soft') or crisp offset block ('hard'). */
  shadowProfile: "soft" | "hard";
}

// Reproduces the pre-style behavior exactly (scales 1, no boost, soft shadows). Used as the
// fallback when no style is supplied — notably code-mode's generateSurfaceColors call, which
// stays untouched until its own pass.
const DEFAULT_TREATMENT: SurfaceTreatment = {
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
const SURFACE_TREATMENT: Record<PaletteStyle, SurfaceTreatment> = {
  square:   { surfaceChromaScale: 0,   containerChromaScale: 0,   minProximityBoost: 0,    outlineContrast: 0,    elevationSpread: 1,    stackLShiftDark: 0,     stackLShiftLight: 0,      shadowProfile: "soft" },
  triangle: { surfaceChromaScale: 0,   containerChromaScale: 1.0, minProximityBoost: 0,    outlineContrast: 0,    elevationSpread: 1,    stackLShiftDark: 0,     stackLShiftLight: 0,      shadowProfile: "soft" },
  circle:   { surfaceChromaScale: 3.5, containerChromaScale: 1.8, minProximityBoost: 0.12, outlineContrast: 0.03, elevationSpread: 1.15, stackLShiftDark: 0,     stackLShiftLight: -0.012, shadowProfile: "soft" },
  diamond:  { surfaceChromaScale: 7.5, containerChromaScale: 3.0, minProximityBoost: 0.35, outlineContrast: 0.10, elevationSpread: 1.5,  stackLShiftDark: -0.04, stackLShiftLight: -0.035, shadowProfile: "hard" },
};

/** Resolve the surface treatment for a style (falls back to the pre-style default). */
export function surfaceTreatmentFor(style?: PaletteStyle): SurfaceTreatment {
  return style ? SURFACE_TREATMENT[style] ?? DEFAULT_TREATMENT : DEFAULT_TREATMENT;
}

/**
 * Searches outward from a preferred lightness until the contrast ratio is met.
 * Use this when you want to stay as close to a target tone as possible
 * (e.g. brand primary at Tone 40), rather than the minimum-satisfying L.
 */
function findLightnessFromTarget(
  baseColor: Color,
  background: Color,
  minRatio: number,
  preferredL: number,
): Color {
  const backgroundL = background.oklch.l ?? 0.5;
  const direction = backgroundL < 0.5 ? 1 : -1; // dark bg → go lighter; light bg → go darker
  const result = baseColor.clone();

  for (let step = 0; step <= 100; step++) {
    const testL = preferredL + direction * step * 0.01;
    if (testL < 0 || testL > 1) break;
    result.oklch.l = testL;
    if (result.contrastWCAG21(background) >= minRatio) return result;
  }

  result.oklch.l = direction === 1 ? 0.98 : 0.02;
  return result;
}

/**
 * Generates an accessible (4.5:1 or 7:1) version of a color to sit on a background.
 * It targets OKLCH L 0.90 (on dark) / 0.12 (on light) for a clean "on-color" look.
 *
 * `chromaFloor` is the minimum chroma the result carries — but it's scaled down as the target
 * lightness approaches the poles, because chroma is barely perceptible at L≈0.12/0.90 (and the
 * gamut ceiling there is tiny). The old code forced a flat 0.06 floor and claimed it kept
 * on-colors "visibly tinted"; at the poles it did almost nothing. Scaling keeps the promise
 * honest: a real tint where L allows it, near-neutral where it doesn't. (Audit 4E.)
 */
function getAccessibleVariant(
  color: Color,
  background: Color,
  minRatio: number,
  chromaFloor: number = 0.06,
): Color {
  const backgroundL = background.oklch.l ?? 0.5;
  const isDarkBg = backgroundL < 0.5;
  const target = color.clone();

  // Target high-contrast levels (OKLCH L 0.90 on dark backgrounds, 0.12 on light)
  target.oklch.l = isDarkBg ? 0.9 : 0.12;

  // Scale the floor by proximity to mid-lightness (≈0 at the poles, full near L 0.5).
  const effectiveFloor = chromaFloor * Math.max(0, 1 - Math.abs((target.oklch.l ?? 0.5) - 0.5) * 2);
  target.oklch.c = Math.max(target.oklch.c ?? 0, effectiveFloor);

  if (target.contrastWCAG21(background) >= minRatio) {
    return target;
  }

  // If that's not enough contrast (extreme background), go to the poles
  target.oklch.l = isDarkBg ? 0.98 : 0.02;
  if (target.contrastWCAG21(background) >= minRatio) {
    return target;
  }

  // Absolute fallback: search for the limit (though Tone 0.02/0.98 should almost always work)
  return findOptimalLightness(target, background, minRatio);
}

function ensureContrast(
  color: Color,
  background: Color,
  minRatio: number,
  chromaFloor: number = 0.06,
): Color {
  if (color.contrastWCAG21(background) >= minRatio) {
    return color.clone();
  }
  // If it's a UI element (3:1), we find the minimal shift.
  // If it's text (4.5:1), we use getAccessibleVariant for a cleaner look.
  if (minRatio >= 4.5) {
    return getAccessibleVariant(color, background, minRatio, chromaFloor);
  }
  return findOptimalLightness(color, background, minRatio);
}

// ===== PRIMARY COLOR ADAPTATION =====

/**
 * Ensures the primary color contrasts with the surface of the mode.
 * Light mode: Ensure primary is dark enough to sit on light surface.
 * Dark mode: Ensure primary is light enough to sit on dark surface.
 */
export function adaptPrimaryForMode(
  primary: Color,
  isDarkMode: boolean,
  targetL?: number,
): Color {
  const surfaceL = isDarkMode ? 0.12 : 0.98;
  const surface = primary.clone();
  surface.oklch.l = surfaceL;
  surface.oklch.c = 0;

  // We use OKLCH L 0.40 (light) / 0.80 (dark) for the primary — M3-INSPIRED, but note these
  // are OKLCH lightness values, NOT M3 HCT "tones". HCT tone ≈ CIE L*, a different scale, so
  // OKLCH L 0.40 ≠ HCT tone 40. Don't cross-reference these against M3 reference palettes.
  // (Audit 4A.) Callers may override (naturally-light + light mode prefers L=0.35).
  const desiredL = targetL ?? (isDarkMode ? 0.8 : 0.4);
  const target = primary.clone();
  target.oklch.l = desiredL;

  if (target.contrastWCAG21(surface) >= 4.5) {
    return target;
  }

  // Search outward from the desired tone instead of converging on the minimum
  // (which would collapse the primary toward the surface lightness).
  return findLightnessFromTarget(target, surface, 4.5, desiredL);
}

/**
 * Chroma for a tinted-neutral surface, damped toward 0 as the surface approaches the mode's
 * "paper" extreme (white in light mode, black in dark). Near those extremes even a tiny OKLCH
 * chroma reads as heavily saturated (HSL saturation blows up as L→1, and a faint wash on a
 * near-white page is conspicuous), so the page canvas and floating overlays trend neutral while
 * mid-elevation containers — further from the extreme — may carry a whisper of brand tint.
 *
 * `intended` is the chroma we'd use mid-range; `proximityRange` is how far from the extreme the
 * tint ramps back to full. (Audit 4B.)
 */
function dampedSurfaceChroma(
  primaryC: number,
  l: number,
  isDarkMode: boolean,
  intended: number,
  minProximity = 0,
): number {
  // HSL saturation (and perceived "colored-ness" of a near-neutral fill) blows up as L
  // approaches EITHER extreme — its denominator 1−|2L−1| → 0 at both black and white. So damp
  // by distance from the nearer extreme: ~0 chroma near black/white, full at mid lightness.
  //
  // `minProximity` sets a floor on that damping per role: the page surface and floating overlay
  // use 0 (they trend fully neutral near white), but containers use a positive floor so they
  // keep a visible brand tint even when their lightness sits close to white. (Audit 4B.)
  const distanceFromExtreme = Math.min(l, 1 - l); // 0 at the poles, 0.5 at mid
  const proximity = Math.max(minProximity, Math.min(1, distanceFromExtreme / 0.5));
  return Math.min(primaryC, intended) * proximity;
}

function surfaceChromaFor(primary: Color, isDarkMode: boolean, treatment: SurfaceTreatment, surfaceL: number): number {
  const c = primary.oklch.c ?? 0;
  // Page canvas: the most restrained tint of the whole stack. Damping is computed at the surface's
  // ACTUAL lightness (after any stack shift) so a diamond page pulled off pure white can hold its
  // tone, while a square page at L≈0.99/0.23 stays near-neutral. surfaceChromaScale dials it.
  return dampedSurfaceChroma(c, surfaceL, isDarkMode, 0.012 * treatment.surfaceChromaScale, treatment.minProximityBoost);
}

// ===== ELEVATION SHADOWS =====

// Relative-color wrapper per output space. Each emits `<fn>(from var(--<token>) <channels> / a)`,
// which passes the source color's channels through unchanged and only overrides alpha — so
// `--shadow-color` / `--highlight-color` stay *real, reusable colors* (in the palette's own
// space) and every layer derives its translucency from them.
const REL_WRAP: Record<ColorFormat, { fn: string; channels: string }> = {
  oklch: { fn: "oklch", channels: "l c h" },
  oklab: { fn: "oklab", channels: "l a b" },
  lab: { fn: "lab", channels: "l a b" },
  lch: { fn: "lch", channels: "l c h" },
  hsl: { fn: "hsl", channels: "h s l" },
  p3: { fn: "color", channels: "display-p3 r g b" },
  srgb: { fn: "rgb", channels: "r g b" },
  rgb: { fn: "rgb", channels: "r g b" },
  hex: { fn: "rgb", channels: "r g b" },
};

function colorToCss(color: Color, format: ColorFormat): string {
  if (format === "hex") return color.to("srgb").toString({ format: "hex" });
  if (format === "rgb" || format === "srgb") return color.to("srgb").toString({ precision: 4 });
  return color.to(format).toString({ precision: 4 });
}

/**
 * A near-neutral, brand-tinted, mode-adapted elevation shadow system, using the layered
 * "smooth shadow" technique: each tier stacks box-shadows with growing offset/blur and negative
 * spread so the penumbra falls off realistically. Design choices baked in here:
 *
 *  - Almost neutral ink (a whisper of the brand hue), darker in light mode so shadows read crisp
 *    rather than hazy; near-black in dark mode.
 *  - DARK MODE leans on a top "key-light" highlight + a couple of shallow layers rather than big
 *    drop shadows (black-on-near-black barely registers; lighter surfaces do the elevation work).
 *  - A top inset HIGHLIGHT (`--highlight-color`) lifts the upper edge of the element.
 *  - All offsets are derived from one `--light-angle` via CSS `sin()`/`cos()`, so the whole set
 *    rotates from a single knob (0deg = straight down). `--shadow-strength` scales every alpha.
 *  - `xs` is a single hairline layer for buttons/hovers.
 *
 * Returns CSS custom properties ready to drop into `:root`.
 */
export function generateElevationShadowVars(
  primary: Color,
  isDarkMode: boolean,
  format: ColorFormat = "oklch",
  style: PaletteStyle = "square",
): Record<string, string> {
  const { shadowProfile } = surfaceTreatmentFor(style);
  const hsl = primary.to("hsl");
  const isAchromatic = (primary.oklch.c ?? 0) < 0.01;
  const hue = Number.isFinite(hsl.coords[0] ?? NaN) ? (hsl.coords[0] as number) : 0;

  // Near-neutral ink: faint hue, low saturation. Darker in light mode (crisp, not hazy).
  const shadowCol = new Color("hsl", [hue, isAchromatic ? 0 : isDarkMode ? 6 : 4, isDarkMode ? 5 : 30]);
  // Key-light edge: lighter than the surface (white-ish in light, a lifted brand tone in dark).
  const highlightCol = new Color("hsl", [hue, isAchromatic ? 0 : isDarkMode ? 14 : 12, isDarkMode ? 62 : 100]);

  const rel = REL_WRAP[format] ?? REL_WRAP.oklch;
  const ink = (alpha: number) =>
    `${rel.fn}(from var(--shadow-color) ${rel.channels} / calc(${alpha} * var(--shadow-strength)))`;
  const lit = (alpha: number) =>
    `${rel.fn}(from var(--highlight-color) ${rel.channels} / calc(${alpha} * var(--shadow-strength)))`;

  // One drop-shadow layer, its offset rotated from --light-angle (0deg ⇒ straight down).
  const layer = (d: number, blur: number, spread: number, alpha: number) =>
    `calc(sin(var(--light-angle)) * ${(-d).toFixed(2)}px) calc(cos(var(--light-angle)) * ${d.toFixed(2)}px) ${blur}px ${spread}px ${ink(alpha)}`;
  const topHighlight = (alpha: number) => `inset 0 1px 0 ${lit(alpha)}`;
  const join = (layers: string[]) => layers.join(",\n    ");

  // [offset-distance, blur, spread, alpha] per layer. Dark tiers are deliberately shallow and
  // lean on the highlight; light tiers layer more, with darker low-alpha ink for a crisp edge.
  const softTiers = isDarkMode
    ? {
        xs: [layer(0.5, 1, 0, 0.4)],
        low: [topHighlight(0.35), layer(1, 2, -0.5, 0.5)],
        medium: [topHighlight(0.4), layer(2, 4, -1, 0.5), layer(6, 9, -2, 0.5)],
        high: [topHighlight(0.45), layer(4, 7, -1, 0.45), layer(12, 18, -2, 0.45), layer(26, 34, -3, 0.45)],
      }
    : {
        xs: [layer(0.5, 0.8, 0, 0.1)],
        low: [topHighlight(0.5), layer(0.5, 0.6, 0, 0.12), layer(1, 1.3, -0.6, 0.12), layer(2.3, 2.7, -1.3, 0.12)],
        medium: [
          topHighlight(0.5),
          layer(0.5, 0.6, 0, 0.12),
          layer(1.8, 2.1, -0.5, 0.12),
          layer(4.5, 5.2, -1, 0.12),
          layer(9, 10.5, -1.6, 0.12),
        ],
        high: [
          topHighlight(0.5),
          layer(0.5, 0.6, 0, 0.11),
          layer(3, 3.5, -0.3, 0.11),
          layer(6, 6.8, -0.6, 0.11),
          layer(10.5, 12, -1, 0.11),
          layer(17, 19, -1.4, 0.11),
          layer(26, 29, -1.9, 0.11),
        ],
      };

  // Hard (brutalist) tiers: one crisp offset block per level — no penumbra, no top highlight,
  // higher alpha — so elevation reads as a hard-edged drop rather than a soft glow.
  const hardTiers = {
    xs: [layer(1, 0, 0, isDarkMode ? 0.6 : 0.5)],
    low: [layer(2, 0, 0, isDarkMode ? 0.7 : 0.55)],
    medium: [layer(4, 0, 0, isDarkMode ? 0.85 : 0.65)],
    high: [layer(7, 0, 0, isDarkMode ? 1 : 0.8)],
  };

  const tiers = shadowProfile === "hard" ? hardTiers : softTiers;

  return {
    "--light-angle": "0deg",
    "--shadow-strength": "1",
    "--shadow-color": colorToCss(shadowCol, format),
    "--highlight-color": colorToCss(highlightCol, format),
    "--shadow-elevation-xs": join(tiers.xs),
    "--shadow-elevation-low": join(tiers.low),
    "--shadow-elevation-medium": join(tiers.medium),
    "--shadow-elevation-high": join(tiers.high),
  };
}

// ===== ACCENT COLOR PREPARATION =====

/**
 * Prepares an accent color (secondary or tertiary) for UI use.
 * Desaturates for better UI integration while retaining some vibrancy from the source.
 */
function prepareAccentColor(
  baseColor: Color,
  role: "secondary" | "tertiary",
): Color {
  const accent = baseColor.clone();

  if (role === "secondary") {
    // Secondary: Muted harmony (Target Chroma ~0.04-0.08)
    accent.oklch.c = Math.min(accent.oklch.c ?? 0, 0.08);
  } else {
    // Tertiary: Vibrant accent (Target Chroma ~0.08-0.12)
    accent.oklch.c = Math.min(accent.oklch.c ?? 0, 0.12);
  }

  return accent;
}

/**
 * Selects secondary and tertiary colors from the palette.
 */
function selectAccentColors(
  paletteType: PaletteKinds,
  palette: BaseColorData[],
  primary: Color,
): { secondary: Color; tertiary: Color } {
  const safeGetColor = (index: number): Color => {
    if (palette[index]?.color) {
      return palette[index].color.clone();
    }
    const fallback = primary.clone();
    fallback.oklch.h = ((fallback.oklch.h ?? 0) + index * 60) % 360;
    fallback.oklch.c = Math.min((fallback.oklch.c ?? 0) * 0.8, 0.12);
    return fallback;
  };

  let secondaryIndex: number;
  let tertiaryIndex: number;

  switch (paletteType) {
    case "com":
      secondaryIndex = 5; // Muted complement
      tertiaryIndex = 1; // Main complement
      break;
    case "spl":
      secondaryIndex = 3; // Muted split 1
      tertiaryIndex = 4; // Pure split 2
      break;
    case "tri":
      secondaryIndex = 3; // Muted triad hue 2
      tertiaryIndex = 4; // Pure triad hue 3
      break;
    case "tet":
      secondaryIndex = 3; // Muted hue 2
      tertiaryIndex = 4; // Pure hue 3
      break;
    case "ana":
      secondaryIndex = 2; // Subtle analogous shift
      tertiaryIndex = 5; // Distinct analogous accent
      break;
    case "tas": // Tints and shades — pick from the 12-color range
      secondaryIndex = 3; // Deeper shade
      tertiaryIndex = 8; // Lighter tint
      break;
    default:
      secondaryIndex = 1;
      tertiaryIndex = 4;
  }

  return {
    secondary: prepareAccentColor(safeGetColor(secondaryIndex), "secondary"),
    tertiary: prepareAccentColor(safeGetColor(tertiaryIndex), "tertiary"),
  };
}

// ===== SURFACE COLOR GENERATION =====

/**
 * Surface slots (4 semantic roles):
 * - surface:            Page/app canvas — <body>, page wrapper, sidebar shell
 * - container:          Inline elevated content — cards, dialogs, sheets (Carbon-level ΔL)
 * - container-sunken:   Recessed wells — text inputs, code blocks, data table rows
 * - container-overlay:  Floating above the page — dropdowns, tooltips, popovers (relies on shadow/border)
 *
 * on-surface:         Primary text (AAA 7:1)
 * on-surface-variant: Secondary text — lightest value that still meets AA 4.5:1 against surface
 */
export function generateSurfaceColors(
  primary: Color,
  isDarkMode: boolean,
  treatment: SurfaceTreatment = DEFAULT_TREATMENT,
): {
  surface: Color;
  onSurface: Color;
  onSurfaceVariant: Color;
  container: Color;
  containerSunken: Color;
  containerOverlay: Color;
} {
  const primaryC = primary.oklch.c ?? 0;
  const containerC = treatment.containerChromaScale;
  const proxBoost = treatment.minProximityBoost;

  const baseSurfaceL = isDarkMode ? 0.23 : 0.99;
  const stackShift = isDarkMode ? treatment.stackLShiftDark : treatment.stackLShiftLight;
  const clampL = (l: number): number => Math.max(0.02, Math.min(0.998, l));
  const surfaceL = clampL(baseSurfaceL + stackShift);

  const surface = primary.clone();
  surface.oklch.l = surfaceL;
  surface.oklch.c = surfaceChromaFor(primary, isDarkMode, treatment, surfaceL);

  // Elevation tiers are placed relative to the UNSHIFTED surface reference: the whole stack
  // shifts together by stackShift (diamond deepens dark / off-whites light so the page can hold
  // a tone), then elevationSpread widens the steps around the shifted surface.
  const spreadL = (tierL: number): number =>
    clampL(surfaceL + (tierL - baseSurfaceL) * treatment.elevationSpread);

  // container: Standard cards — the most tinted of the stack (furthest from paper in light mode,
  // so the damping lets the brand tint actually show here). (Audit 4B.)
  const container = primary.clone();
  const containerL = spreadL(isDarkMode ? 0.27 : 0.96);
  container.oklch.l = containerL;
  // Dark containers sit at a lower (more mid) lightness, so they tolerate more chroma before
  // reading as oversaturated — give dark a higher intended so its tint matches the light card.
  container.oklch.c = dampedSurfaceChroma(primaryC, containerL, isDarkMode, (isDarkMode ? 0.032 : 0.018) * containerC, 0.34 + proxBoost);

  // container-sunken: Inset wells — recessed below surface or container
  const containerSunken = primary.clone();
  const sunkenL = spreadL(isDarkMode ? 0.18 : 0.935);
  containerSunken.oklch.l = sunkenL;
  containerSunken.oklch.c = dampedSurfaceChroma(primaryC, sunkenL, isDarkMode, (isDarkMode ? 0.024 : 0.014) * containerC, 0.26 + proxBoost);

  // container-overlay: Floating elements. Near-white in light mode → the damping makes it
  // essentially neutral, so it relies on the `shadow` token to read as elevated (see
  // generateUiColorPalette); visibly lifted (and faintly tinted) in dark.
  const containerOverlay = primary.clone();
  const overlayL = spreadL(isDarkMode ? 0.31 : 0.995);
  containerOverlay.oklch.l = overlayL;
  containerOverlay.oklch.c = dampedSurfaceChroma(primaryC, overlayL, isDarkMode, 0.014 * containerC, 0 + proxBoost);

  // Worst-case background for contrast checking, WITHIN THE NEUTRAL SURFACE STACK:
  // Light Mode (Dark Text): Lowest contrast occurs on the darkest background (sunken)
  // Dark Mode (Light Text): Lowest contrast occurs on the lightest background (overlay)
  // Scope caveat: on-surface / on-surface-variant are guaranteed only against these neutral
  // surfaces. They are NOT verified against the tinted accent containers (primary-container,
  // error-container, …) — text on those should use the matching on-*-container token, which
  // makeContainerForAccent verifies separately. (Audit 2D.3.)
  const worstCaseBackground = isDarkMode ? containerOverlay : containerSunken;

  const onSurface = primary.clone();
  onSurface.oklch.c = 0.01;
  onSurface.oklch.l = isDarkMode ? 0.95 : 0.1;
  // chromaFloor=0: body text stays near-neutral even if a fallback adjustment fires.
  const onSurfaceAdjusted = ensureContrast(onSurface, worstCaseBackground, 7.0, 0);

  // on-surface-variant: Secondary text — AA 4.5:1 against worst-case background
  const onSurfaceVariant = primary.clone();
  onSurfaceVariant.oklch.c = 0.01;
  const onSurfaceVariantAdjusted = findOptimalLightness(
    onSurfaceVariant,
    worstCaseBackground,
    4.5,
  );

  return {
    surface,
    onSurface: onSurfaceAdjusted,
    onSurfaceVariant: onSurfaceVariantAdjusted,
    container,
    containerSunken,
    containerOverlay,
  };
}

// ===== OUTLINE AND INVERSE COLORS =====

export function generateOutlineAndInverse(
  primary: Color,
  isDarkMode: boolean,
  surface: Color,
  onSurface: Color,
  treatment: SurfaceTreatment = DEFAULT_TREATMENT,
): {
  outline: Color;
  outlineVariant: Color;
  inverseSurface: Color;
  onInverseSurface: Color;
} {
  const outlineBase = primary.clone();
  outlineBase.oklch.c = 0.005;

  // outlineContrast pushes the lines further from the surface lightness (diamond → harder,
  // more visible borders for the brutalist read); 0 leaves the calm default.
  const contrastDir = isDarkMode ? 1 : -1;

  const outline = outlineBase.clone();
  outline.oklch.l = (isDarkMode ? 0.6 : 0.5) + contrastDir * treatment.outlineContrast;
  const outlineAdjusted = ensureContrast(outline, surface, 3.0);

  // outline-variant: Decorative dividers — subtle delta (~0.06) from surface
  const outlineVariant = outlineBase.clone();
  outlineVariant.oklch.l = (isDarkMode ? 0.2 : 0.92) + contrastDir * treatment.outlineContrast * 1.5;

  // Inverse colors (snackbars, etc.): a whisper of the brand tint so they stay in the same
  // family as the rest of the (tinted-neutral) surfaces rather than reading as a foreign pure
  // grey. The chroma is tiny, so the inverse contrast is unaffected. (Audit 4H.)
  const inverseSurface = onSurface.clone();
  inverseSurface.oklch.h = primary.oklch.h ?? inverseSurface.oklch.h;
  inverseSurface.oklch.c = isDarkMode ? 0.006 : 0.008;

  const onInverseSurface = surface.clone();
  onInverseSurface.oklch.h = primary.oklch.h ?? onInverseSurface.oklch.h;
  onInverseSurface.oklch.c = isDarkMode ? 0.008 : 0.006;

  return {
    outline: outlineAdjusted,
    outlineVariant,
    inverseSurface,
    onInverseSurface,
  };
}

// ===== SEMANTIC COLOR GENERATION =====

/** Aurora overrides (code-mode): pull functional colors to the kind's saturation + lean them
 *  toward the base family, so error/warning/success belong to the theme without losing their
 *  canonical meaning. Omitted by the UI palette, which keeps the fixed signal band. */
export interface SemanticAuroraOptions {
  /** Target chroma for all semantics (the kind's character centre), clamped to a signal-safe band. */
  chromaTarget?: number;
  /** Hue of the base family; canonical semantic hues lean toward it by up to leanCap. */
  familyHue?: number;
  /** Max degrees a semantic hue may lean toward familyHue (default 0 = no lean). */
  leanCap?: number;
}

export function generateSemanticColors(
  primary: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  surface?: Color,
  options: SemanticAuroraOptions = {},
): {
  error: Color;
  onError: Color;
  success: Color;
  onSuccess: Color;
  warning: Color;
  onWarning: Color;
} {
  const medianChroma = getMedianChroma(palette);

  // Canonical semantic HUES are pinned (not borrowed from the palette): an "error" must read
  // as red, not as whatever palette swatch happened to fall within 30° of red. We only borrow
  // *chroma* from a nearby palette member so the semantics feel related to the brand, with a
  // floor so they stay saturated enough to signal. (Audit 2A.)
  const borrowChroma = (hue: number): number => {
    // Aurora: when a chroma target is supplied (code-mode), every semantic sits at the kind's
    // saturation (Nord-muted → Dracula-neon), clamped so even the muted kinds still signal.
    if (options.chromaTarget !== undefined) {
      return Math.min(Math.max(options.chromaTarget, 0.10), 0.19);
    }
    const match = findColorByHue(palette, hue, 25);
    const c = match?.oklch.c ?? medianChroma;
    // Floor keeps semantics saturated enough to read AND to stay separable under CVD
    // (perceptual distance grows with chroma); ceiling keeps them from screaming.
    return Math.min(Math.max(c, 0.13), 0.18);
  };

  // Distinct lightness targets per role. Separating error/success/warning in LIGHTNESS — not
  // just hue — keeps them distinguishable for red-green color-vision deficiency, where the
  // hue channel that normally separates red from green collapses. (Audit 2B.1.) Amber sits
  // lighter because high-chroma yellow is only realizable at higher L.
  const targetL = isDarkMode
    ? { error: 0.66, warning: 0.90, success: 0.74 }
    : { error: 0.42, warning: 0.62, success: 0.50 };

  // Construct fresh from explicit OKLCH coords. Building via `primary.clone()` breaks for
  // achromatic seeds (NaN hue): assigning `.oklch.h` onto a chroma-0 color doesn't reliably
  // take, leaving the semantics neutral (and thus indistinguishable under CVD).
  // Aurora hue lean: nudge each canonical hue a bounded amount toward the base family so the
  // semantics feel related (Nord's aurora) without drifting far enough to lose their meaning.
  const leanHue = (canonical: number): number => {
    if (options.familyHue === undefined || !options.leanCap) return canonical;
    const signed = ((options.familyHue - canonical + 540) % 360) - 180;
    return (canonical + Math.max(-options.leanCap, Math.min(options.leanCap, signed)) + 360) % 360;
  };

  const make = (hue: number, l: number): Color =>
    new Color("oklch", [l, borrowChroma(hue), hue]);

  // Success uses a teal-leaning green (162°) rather than a pure green (~145°). The blue-yellow
  // axis it gains is preserved under red-green CVD, so success stays distinct from both amber
  // (warning) and red (error) for deuteranopes/protanopes — pure green collapses onto amber.
  let error = make(leanHue(27), targetL.error);
  let warning = make(leanHue(83), targetL.warning);
  let success = make(leanHue(162), targetL.success);

  // Step the semantic L back toward the surface only as far as needed to keep 4.5:1 — preserves
  // the perceived hue while making inline use (text/icons on surface) safe. Done FIRST so the
  // CVD pass (below) can then separate them without re-colliding.
  const clampAgainstSurface = (c: Color): Color => {
    if (!surface) return c;
    if (c.contrastWCAG21(surface) >= 4.5) return c;
    return findLightnessFromTarget(c, surface, 4.5, c.oklch.l ?? 0.5);
  };

  error = clampAgainstSurface(error);
  warning = clampAgainstSurface(warning);
  success = clampAgainstSurface(success);

  // Separate the three in OKLCH lightness so they stay mutually distinct *as a red-green
  // dichromat sees them*. Each color is re-placed at the lightness — within its contrast-safe
  // band against the surface — that maximizes CVD distance from the colors already placed.
  // Green is placed last (it's the one most confusable with both red and amber).
  ({ error, warning, success } = enforceCvdDistinctSemantics(error, warning, success, surface));

  const onError = getAccessibleVariant(error, error, 4.5);
  const onSuccess = getAccessibleVariant(success, success, 4.5);
  const onWarning = getAccessibleVariant(warning, warning, 4.5);

  return {
    error,
    onError,
    success,
    onSuccess,
    warning,
    onWarning,
  };
}

/**
 * Push error/warning/success apart in lightness until each pair clears a minimum perceptual
 * distance *under deuteranopia + protanopia simulation*. Without this, red error and green
 * success — the single most confusable CVD pair — can render near-identical. We only move
 * lightness (cheap, monotonic, doesn't break the canonical hue identity).
 */
function enforceCvdDistinctSemantics(
  error: Color,
  warning: Color,
  success: Color,
  surface: Color | undefined,
  minDist = 14,
): { error: Color; warning: Color; success: Color } {
  // Lightness range we may explore (kept inside legible bounds). The contrast filter below
  // further restricts this per-color so every result still clears 4.5:1 against the surface.
  const candidateLs: number[] = [];
  for (let l = 0.18; l <= 0.96; l += 0.02) candidateLs.push(l);

  const contrastOk = (c: Color): boolean =>
    !surface || c.contrastWCAG21(surface) >= 4.5;

  // Place error first (anchor), then amber, then green — green is confusable with BOTH, so it
  // gets last pick of the remaining lightness space.
  const placed: Color[] = [error];
  const place = (c: Color) => {
    const targetL = c.oklch.l ?? 0.5;
    let best = targetL;
    let bestScore = -Infinity;
    for (const l of candidateLs) {
      const probe = c.clone();
      probe.oklch.l = l;
      if (!contrastOk(probe)) continue;
      let minD = Infinity;
      for (const p of placed) minD = Math.min(minD, cvdDistance(probe, p));
      // Reward distinctness; gently prefer staying near the role's natural lightness so amber
      // stays light, error stays deep, etc. The bonus is dwarfed once a pair is below minDist.
      const score = Math.min(minD, minDist) * 10 - Math.abs(l - targetL);
      if (score > bestScore) {
        bestScore = score;
        best = l;
      }
    }
    c.oklch.l = best;
    placed.push(c);
  };
  place(warning);
  place(success);

  return { error, warning, success };
}

// ===== CONTAINER GENERATION =====

/**
 * Builds a soft container surface + accessible on-color for any accent family
 * (primary, secondary, tertiary, error, success, warning).
 *
 * Container sits at Tone 90 (light) / Tone 30 (dark) with reduced chroma so it
 * reads as a tinted wash. The on-color gets boosted chroma for legibility
 * against that soft background.
 */
export function makeContainerForAccent(
  accent: Color,
  isDarkMode: boolean,
): { container: Color; onContainer: Color } {
  const accentC = accent.oklch.c ?? 0;

  const container = accent.clone();
  container.oklch.l = isDarkMode ? 0.30 : 0.90;
  container.oklch.c = Math.min(accentC * 0.4, 0.10);

  const onContainerBase = container.clone();
  onContainerBase.oklch.c = Math.min(accentC * 0.7, 0.16);
  const onContainer = getAccessibleVariant(onContainerBase, container, 4.5);

  return { container, onContainer };
}

// ===== MAIN PALETTE GENERATION =====

export function generateUiColorPalette(
  color: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteType: PaletteKinds,
  colorFormat: ColorFormat,
  paletteStyle: PaletteStyle = "square",
): BaseColorData[] {
  // Per-style surface material treatment — neutral (square) → brutalist (diamond).
  const treatment = surfaceTreatmentFor(paletteStyle);

  // Step 1: Adapt primary family roles. All four branches route through
  // adaptPrimaryForMode so the assigned L is verified against surface contrast.
  const isNaturallyLight = (color.oklch.l ?? 0.5) > 0.5;
  // Naturally-light + light mode used to bias slightly darker (Tone 35); preserve that.
  const primaryTargetL = (isNaturallyLight && !isDarkMode) ? 0.35 : undefined;
  const primary = adaptPrimaryForMode(color, isDarkMode, primaryTargetL);

  const onPrimary = getAccessibleVariant(primary, primary, 4.5);
  const { container: primaryContainer, onContainer: onPrimaryContainer } =
    makeContainerForAccent(primary, isDarkMode);

  // Step 3: Surface colors (AAA contrast) — generated before accents so surface is available
  const surfaces = generateSurfaceColors(primary, isDarkMode, treatment);

  // Step 4: Accent colors — adapted for the current mode
  const { secondary: secondaryRaw, tertiary: tertiaryRaw } = selectAccentColors(
    paletteType,
    palette,
    primary,
  );

  // Secondary and Tertiary follow the same lightness targets as Primary (OKLCH L 0.4 light /
  // 0.8 dark, picked so the on-color lands on the opposite pole). We assign the target L and
  // then VERIFY it against the surface, searching outward only if needed — previously the L
  // was hard-assigned with no contrast check, so these were accessible only by luck of the
  // accent's chroma. (Audit 2C.1.)
  const verifyAgainstSurface = (c: Color, targetL: number): Color => {
    const out = c.clone();
    out.oklch.l = targetL;
    if (out.contrastWCAG21(surfaces.surface) >= 4.5) return out;
    return findLightnessFromTarget(out, surfaces.surface, 4.5, targetL);
  };
  const accentTargetL = isDarkMode ? 0.8 : 0.4;
  const secondary = verifyAgainstSurface(secondaryRaw, accentTargetL);
  const tertiary = verifyAgainstSurface(tertiaryRaw, accentTargetL);

  const onSecondary = getAccessibleVariant(secondary, secondary, 4.5);
  const onTertiary = getAccessibleVariant(tertiary, tertiary, 4.5);

  const { container: secondaryContainer, onContainer: onSecondaryContainer } =
    makeContainerForAccent(secondary, isDarkMode);
  const { container: tertiaryContainer, onContainer: onTertiaryContainer } =
    makeContainerForAccent(tertiary, isDarkMode);

  // Step 5: Outline and inverse colors
  const outlineInverse = generateOutlineAndInverse(
    primary,
    isDarkMode,
    surfaces.surface,
    surfaces.onSurface,
    treatment,
  );

  // Step 6: Semantic colors (AA contrast) — clamped against surface so inline use is safe
  const semantic = generateSemanticColors(primary, palette, isDarkMode, surfaces.surface);

  const { container: errorContainer, onContainer: onErrorContainer } =
    makeContainerForAccent(semantic.error, isDarkMode);
  const { container: successContainer, onContainer: onSuccessContainer } =
    makeContainerForAccent(semantic.success, isDarkMode);
  const { container: warningContainer, onContainer: onWarningContainer } =
    makeContainerForAccent(semantic.warning, isDarkMode);

  // Interaction-state & utility tokens (Audit 4C/4D — the set was previously missing every
  // hover/pressed/disabled state plus scrim/shadow, so a real UI couldn't be built from it).
  // M3 state layers = the on-color composited over the base at a fixed opacity; we bake those
  // to solid tokens (hover 8%, pressed 12%). scrim/shadow are pure black for consumers to apply
  // at their own alpha (modal backdrops, elevation shadows — the latter is what lets near-white
  // light-mode overlays read as elevated).
  const stateLayer = (base: Color, on: Color, opacity: number): Color =>
    base.clone().mix(on, opacity, { space: "srgb", outputSpace: "srgb" }) as Color;
  const primaryHover = stateLayer(primary, onPrimary, 0.08);
  const primaryPressed = stateLayer(primary, onPrimary, 0.12);

  const scrim = new Color("oklch", [0, 0, 0]);
  const shadow = new Color("oklch", [0, 0, 0]);

  // Disabled: neutral, low-emphasis (hue-stripped so it reads as inactive).
  const onDisabled = surfaces.onSurfaceVariant.clone();
  onDisabled.oklch.c = 0;
  onDisabled.oklch.l = isDarkMode ? 0.45 : 0.62;
  const disabledContainer = surfaces.surface.clone();
  disabledContainer.oklch.c = 0;
  disabledContainer.oklch.l = isDarkMode ? 0.26 : 0.93;

  // Step 7: Return tokens in consistent order (count derived from the roles below, not fixed).
  return [
    // Primary colors (4)
    colorFactory(primary, "primary", 0, colorFormat, false, true),
    colorFactory(onPrimary, "on-primary", 0, colorFormat, false, true),
    colorFactory(
      primaryContainer,
      "primary-container",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      onPrimaryContainer,
      "on-primary-container",
      0,
      colorFormat,
      false,
      true,
    ),

    // Secondary colors (4)
    colorFactory(secondary, "secondary", 0, colorFormat, false, true),
    colorFactory(onSecondary, "on-secondary", 0, colorFormat, false, true),
    colorFactory(secondaryContainer, "secondary-container", 0, colorFormat, false, true),
    colorFactory(onSecondaryContainer, "on-secondary-container", 0, colorFormat, false, true),

    // Tertiary colors (4)
    colorFactory(tertiary, "tertiary", 0, colorFormat, false, true),
    colorFactory(onTertiary, "on-tertiary", 0, colorFormat, false, true),
    colorFactory(tertiaryContainer, "tertiary-container", 0, colorFormat, false, true),
    colorFactory(onTertiaryContainer, "on-tertiary-container", 0, colorFormat, false, true),

    // Surface colors (3)
    colorFactory(surfaces.surface, "surface", 0, colorFormat, false, true),
    colorFactory(surfaces.onSurface, "on-surface", 0, colorFormat, false, true),
    colorFactory(
      surfaces.onSurfaceVariant,
      "on-surface-variant",
      0,
      colorFormat,
      false,
      true,
    ),

    // Container variants (3)
    colorFactory(surfaces.container, "container", 0, colorFormat, false, true),
    colorFactory(
      surfaces.containerSunken,
      "container-sunken",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      surfaces.containerOverlay,
      "container-overlay",
      0,
      colorFormat,
      false,
      true,
    ),

    // Outline (2)
    colorFactory(outlineInverse.outline, "outline", 0, colorFormat, false, true),
    colorFactory(
      outlineInverse.outlineVariant,
      "outline-variant",
      0,
      colorFormat,
      false,
      true,
    ),

    // Inverse (2)
    colorFactory(
      outlineInverse.inverseSurface,
      "inverse-surface",
      0,
      colorFormat,
      false,
      true,
    ),
    colorFactory(
      outlineInverse.onInverseSurface,
      "on-inverse-surface",
      0,
      colorFormat,
      false,
      true,
    ),

    // Semantic colors (12)
    colorFactory(semantic.error, "error", 0, colorFormat, false, true),
    colorFactory(semantic.onError, "on-error", 0, colorFormat, false, true),
    colorFactory(errorContainer, "error-container", 0, colorFormat, false, true),
    colorFactory(onErrorContainer, "on-error-container", 0, colorFormat, false, true),
    colorFactory(semantic.success, "success", 0, colorFormat, false, true),
    colorFactory(semantic.onSuccess, "on-success", 0, colorFormat, false, true),
    colorFactory(successContainer, "success-container", 0, colorFormat, false, true),
    colorFactory(onSuccessContainer, "on-success-container", 0, colorFormat, false, true),
    colorFactory(semantic.warning, "warning", 0, colorFormat, false, true),
    colorFactory(semantic.onWarning, "on-warning", 0, colorFormat, false, true),
    colorFactory(warningContainer, "warning-container", 0, colorFormat, false, true),
    colorFactory(onWarningContainer, "on-warning-container", 0, colorFormat, false, true),

    // Interaction states + disabled + utility (Audit 4C/4D)
    colorFactory(primaryHover, "primary-hover", 0, colorFormat, false, true),
    colorFactory(primaryPressed, "primary-pressed", 0, colorFormat, false, true),
    colorFactory(onDisabled, "on-disabled", 0, colorFormat, false, true),
    colorFactory(disabledContainer, "disabled-container", 0, colorFormat, false, true),
    colorFactory(scrim, "scrim", 0, colorFormat, false, true),
    colorFactory(shadow, "shadow", 0, colorFormat, false, true),
  ];
}
