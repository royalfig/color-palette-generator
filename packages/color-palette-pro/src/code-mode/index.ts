import Color from "colorjs.io";
import { PaletteKinds, PaletteStyle } from "../types/types";
import type {
  BaseColorData,
  CodeThemeOutput,
  CodeThemeTemplate,
  SemanticColors,
  SurfaceBundle,
  ThemeData,
  ThemeFormat,
  ZedThemeOutput,
} from "./types";
import { serializeAsZed } from "./formats/zed";
import { serializeAsIterm2 } from "./formats/iterm2";
import { serializeAsGhostty } from "./formats/ghostty";
import { serializeAsWarp } from "./formats/warp";
import { serializeAsAlacritty } from "./formats/alacritty";
import { analogousTemplate } from "./templates/analogous";
import { complementaryTemplate } from "./templates/complementary";
import { splitComplementaryTemplate } from "./templates/splitcomp";
import { tetradicTemplate } from "./templates/tetradic";
import { triadicTemplate } from "./templates/triadic";
import { tintsAndShadesTemplate } from "./templates/tintsAndShades";
import { tonesTemplate } from "./templates/tones";
import {
  deriveUiColors,
  generateBaseTokenRules,
  generateSemanticTokenRules,
} from "./templates/base";
import {
  findColorByHue,
  toHex,
  desaturate,
  mixColors,
  tintTowardHue,
  hueGapDeg,
} from "./utils";
import { getPersonalityConfig } from "./personality";
import { APCA_TARGET_SELECTION_OVERLAY } from "./constants";
import { themeNames, buildDescription } from "./names";
import { buildSyntax } from "./syntax";
import { deriveAnsiPalette } from "./ansi";
import { intensityChromaFor } from "./intensity";
import { legibleOverlayAlpha } from "./overlay";
import { generateOutlineAndInverse } from "../ui/outline";
import { generateSemanticColors } from "../ui/semantic";
import { generateSurfaceColors, makeContainerForAccent } from "../ui/surface";
import { adaptPrimaryForMode, surfaceTreatmentFor } from "../ui/uiUtils";

const templateRegistry: Record<PaletteKinds, CodeThemeTemplate> = {
  ana: analogousTemplate,
  com: complementaryTemplate,
  spl: splitComplementaryTemplate,
  tet: tetradicTemplate,
  tri: triadicTemplate,
  tas: tintsAndShadesTemplate,
  ton: tonesTemplate,
};

function buildThemeData(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = "square",
): ThemeData {
  const template = templateRegistry[paletteKind];
  if (!template) throw new Error(`Unknown palette kind: ${paletteKind}`);

  const personality = getPersonalityConfig(paletteKind, paletteStyle);

  const rawPrimary = (palette[0]?.color ?? baseColor).clone();
  const primary = adaptPrimaryForMode(rawPrimary, isDarkMode);

  // Seed-driven palette intensity (audit note 3): the base color's chroma — not the palette
  // kind — sets how saturated the ANSI core and the Aurora semantics run (see intensity.ts).
  const intensityChroma = intensityChromaFor(
    rawPrimary.oklch.c ?? 0,
    paletteStyle,
  );

  const treatment = surfaceTreatmentFor(paletteStyle);
  const surfaceTones = generateSurfaceColors(primary, isDarkMode, treatment);
  const { outline, outlineVariant } = generateOutlineAndInverse(
    primary,
    isDarkMode,
    surfaceTones.surface,
    surfaceTones.onSurface,
    treatment,
  );
  const surfaces: SurfaceBundle = { ...surfaceTones, outline, outlineVariant };

  const sp = personality.surfaceProfile;

  // Passthrough: code-mode chrome uses the UI surface stack directly — the same style-aware
  // surfaces the app palette gets (square neutral → diamond brutalist) — instead of the old
  // per-lens editor-depth + chrome-chroma overrides. The editor is the page surface; sidebar /
  // panel recede to the sunken well; overlays and inputs sit on the floating/sunken tiers. Kind
  // identity now lives in the syntax bands and the surface hue (which follows the base color),
  // not in a bespoke editor-bg tint.
  const editorBgBase = surfaces.surface.clone();
  const sidebarBg = surfaces.containerSunken.clone();
  const panelBg = sidebarBg.clone();
  const overlayBg = surfaces.containerOverlay.clone();
  const inputSunken = surfaces.containerSunken.clone();

  // Status bar: a UI-gen passthrough — the primary-container wash (a soft branded bar), the same
  // token the app palette uses. Replaces the old bespoke per-style status-bar logic; the bar's
  // border falls back to the divider (no special seam).
  const statusBarBg = makeContainerForAccent(primary, isDarkMode).container;

  const divider = outlineVariant.clone();

  const neutralBandBase = isDarkMode
    ? mixColors(surfaces.container, surfaces.containerOverlay, 0.5)
    : mixColors(surfaces.surface, surfaces.containerSunken, 0.4);
  const neutralBand =
    sp.neutralBandTint > 0
      ? tintTowardHue(
          neutralBandBase,
          primary.oklch.h ?? 0,
          sp.neutralBandTint,
          0.008,
        )
      : neutralBandBase;

  // Aurora functional tier: error/warning/success keep their canonical hue (they must still
  // read as error/warning/success) but adopt the kind's saturation, and — for the in-family
  // kinds (analogous, monochrome) — lean a few degrees toward the base so they belong.
  const inFamilySemantics =
    paletteKind === "ana" || personality.paletteCharacter === "mono";
  const semantics = generateSemanticColors(
    primary,
    palette,
    isDarkMode,
    editorBgBase,
    {
      chromaTarget: intensityChroma,
      familyHue: primary.oklch.h ?? undefined,
      leanCap: inFamilySemantics ? 10 : 0,
    },
  );

  const primaryContainerPair = makeContainerForAccent(primary, isDarkMode);
  const errorContainerPair = makeContainerForAccent(
    semantics.error,
    isDarkMode,
  );
  const warningContainerPair = makeContainerForAccent(
    semantics.warning,
    isDarkMode,
  );
  const successContainerPair = makeContainerForAccent(
    semantics.success,
    isDarkMode,
  );

  const SECONDARY_INDEX: Record<PaletteKinds, number> = {
    com: 5,
    spl: 3,
    tri: 3,
    tet: 3,
    ana: 2,
    tas: 3,
    ton: 1,
  };
  const secondaryPaletteIdx = SECONDARY_INDEX[paletteKind] ?? 1;
  const secondaryRaw = (
    palette[secondaryPaletteIdx]?.color ??
    (() => {
      const c = primary.clone();
      c.oklch.h = ((c.oklch.h ?? 0) + 60) % 360;
      return c;
    })()
  ).clone();
  secondaryRaw.oklch.l = isDarkMode ? 0.8 : 0.4;
  secondaryRaw.oklch.c = Math.min(secondaryRaw.oklch.c ?? 0, 0.08);
  const secondaryContainerPair = makeContainerForAccent(
    secondaryRaw,
    isDarkMode,
  );
  const onSecondary = (() => {
    const t = secondaryRaw.clone();
    t.oklch.l = isDarkMode ? 0.12 : 0.95;
    return t;
  })();

  // Info/link/ANSI-blue must read as *blue* (h ~205–255). Prefer a real blue palette
  // member, but pin the hue into the blue band when the palette has none — a green
  // "info" colour breaks links and ANSI 4 (the chartreuse-complement failure mode).
  const infoFromPalette = findColorByHue(palette, 235, 30);
  const infoColor = (
    infoFromPalette ??
    (() => {
      const fb = primary.clone();
      fb.oklch.c = Math.min((primary.oklch.c ?? 0) * 0.9, 0.13);
      return fb;
    })()
  ).clone();
  {
    const signed = (((infoColor.oklch.h ?? 235) - 235 + 540) % 360) - 180;
    infoColor.oklch.h = (235 + Math.max(-30, Math.min(30, signed)) + 360) % 360;
  }
  infoColor.oklch.l = isDarkMode ? 0.75 : 0.45;
  const infoContainerPair = makeContainerForAccent(infoColor, isDarkMode);

  // Push the template's raw per-role colors through the syntax pipeline (see syntax.ts):
  // hue conventions → band normalize → comment hue → contrast floor → distinction →
  // identifier family → mono pin.
  const rawSyntax = template.deriveColors(
    baseColor,
    palette,
    isDarkMode,
    surfaces,
  );
  const syntax = buildSyntax(rawSyntax, {
    bg: editorBgBase,
    isDarkMode,
    bands: personality.tokenBands,
    accentRoles: personality.accentRoles,
    character: personality.paletteCharacter,
    monoHue: primary.oklch.h ?? NaN,
  });

  const rawBracketPairs = template.deriveBracketPairs(
    baseColor,
    palette,
    isDarkMode,
  );
  const bracketPairColors = rawBracketPairs.map(toHex);

  const markdownQuote = desaturate(syntax.stringColor.clone(), 0.4);

  // Comments are solid in both modes — every exemplar uses opaque comment colors,
  // and the recessed feel now comes from the APCA comment band instead of alpha.
  const commentHex = toHex(syntax.commentColor);
  const punctuationHex = toHex(syntax.punctuationColor);

  const cursorColor =
    sp.cursorSource === "foreground"
      ? surfaces.onSurface.clone()
      : syntax.accentColor.clone();

  // UI accent: the corpus draws focusBorder/buttons/badges from the *token palette*,
  // preferring the cool structural family (h 233–299 in 18 of 22 themes; Vitesse's
  // green accent is a palette-identity exception, which this reproduces for
  // cool-less palettes). Reusing the final token color keeps accent ≡ token (ΔE 0).
  const uiAccent = (() => {
    const candidates = [
      syntax.definitionColor,
      syntax.keywordColor,
      syntax.typeColor,
      syntax.numberColor,
      syntax.accentColor,
    ];
    let best: Color | null = null;
    let bestGap = Infinity;
    for (const c of candidates) {
      if ((c.oklch.c ?? 0) < 0.05) continue;
      const g = hueGapDeg(c.oklch.h ?? 0, 265);
      if (g < bestGap) {
        bestGap = g;
        best = c;
      }
    }
    return (best ?? primary).clone();
  })();

  // Editor foreground: tinted themes carry the bg hue into the fg at a whisper
  // (corpus Δhue vs bg ≤ 16°, C median ≈ 0.02); the neutral school stays at C 0.
  // Passthrough: editor foreground is the UI on-surface text color directly.
  const editorFg = surfaces.onSurface.clone();

  // ANSI palette: resample the seed palette at the six chromatic slots + a lifted near-black
  // (see ansi.ts). Convention-placed tokens seed the candidate pool ahead of raw swatches.
  const ansi = deriveAnsiPalette({
    palette,
    tokens: [
      syntax.keywordColor,
      syntax.stringColor,
      syntax.definitionColor,
      syntax.typeColor,
      syntax.numberColor,
      syntax.accentColor,
    ],
    onSurface: surfaces.onSurface,
    editorBg: editorBgBase,
    chromaCentre: intensityChroma,
    style: paletteStyle,
    isDarkMode,
  });

  const semanticColors: SemanticColors = {
    editorBackground: { hex: toHex(editorBgBase) },
    editorForeground: { hex: toHex(editorFg) },
    sidebarBackground: { hex: toHex(sidebarBg) },
    panelBackground: { hex: toHex(panelBg) },
    overlayBackground: { hex: toHex(overlayBg) },
    statusBarBackground: { hex: toHex(statusBarBg) },
    focusBorder: { hex: toHex(uiAccent) },
    inputBackground: { hex: toHex(panelBg) },
    inputSunken: { hex: toHex(inputSunken) },
    divider: { hex: toHex(divider) },
    outline: { hex: toHex(surfaces.outline) },
    outlineVariant: { hex: toHex(surfaces.outlineVariant) },
    neutralBand: { hex: toHex(neutralBand) },
    cursorColor: { hex: toHex(cursorColor) },

    defaultForeground: { hex: toHex(editorFg) },
    definitionColor: { hex: toHex(syntax.definitionColor) },
    keywordColor: { hex: toHex(syntax.keywordColor) },
    typeColor: { hex: toHex(syntax.typeColor) },
    stringColor: { hex: toHex(syntax.stringColor) },
    numberColor: { hex: toHex(syntax.numberColor) },
    regexColor: { hex: toHex(syntax.regexColor) },
    accentColor: { hex: toHex(syntax.accentColor) },

    variableColor: { hex: toHex(syntax.variableColor) },
    propertyColor: { hex: toHex(syntax.propertyColor) },
    operatorColor: { hex: toHex(syntax.operatorColor) },
    punctuationColor: { hex: punctuationHex },
    commentColor: { hex: commentHex },

    errorForeground: { hex: toHex(semantics.error) },
    errorContainer: { hex: toHex(errorContainerPair.container) },
    onErrorContainer: { hex: toHex(errorContainerPair.onContainer) },
    warningForeground: { hex: toHex(semantics.warning) },
    warningContainer: { hex: toHex(warningContainerPair.container) },
    onWarningContainer: { hex: toHex(warningContainerPair.onContainer) },
    infoForeground: { hex: toHex(infoColor) },
    infoContainer: { hex: toHex(infoContainerPair.container) },
    onInfoContainer: { hex: toHex(infoContainerPair.onContainer) },
    successForeground: { hex: toHex(semantics.success) },
    successContainer: { hex: toHex(successContainerPair.container) },
    onSuccessContainer: { hex: toHex(successContainerPair.onContainer) },

    primaryContainer: { hex: toHex(primaryContainerPair.container) },
    onPrimaryContainer: { hex: toHex(primaryContainerPair.onContainer) },
    secondaryColor: { hex: toHex(secondaryRaw) },
    onSecondaryColor: { hex: toHex(onSecondary) },
    secondaryContainer: { hex: toHex(secondaryContainerPair.container) },
    onSecondaryContainer: { hex: toHex(secondaryContainerPair.onContainer) },

    terminalAnsiBlack: { hex: toHex(ansi.black) },
    terminalAnsiRed: { hex: toHex(ansi.red) },
    terminalAnsiGreen: { hex: toHex(ansi.green) },
    terminalAnsiYellow: { hex: toHex(ansi.yellow) },
    terminalAnsiBlue: { hex: toHex(ansi.blue) },
    terminalAnsiMagenta: { hex: toHex(ansi.magenta) },
    terminalAnsiCyan: { hex: toHex(ansi.cyan) },
    // ANSI white = main foreground (carries the same bg-hue whisper as editorFg).
    terminalAnsiWhite: { hex: toHex(editorFg) },

    markdownHeadingColor: { hex: toHex(syntax.definitionColor) },
    markdownLinkColor: { hex: toHex(infoColor) },
    markdownQuoteColor: { hex: toHex(markdownQuote) },

    bracketPairColors,
  };

  const peakStartAlpha = isDarkMode ? sp.peakAlpha.dark : sp.peakAlpha.light;
  const peakAlpha = legibleOverlayAlpha(
    semanticColors.focusBorder.hex,
    semanticColors.editorBackground.hex,
    semanticColors.editorForeground.hex,
    peakStartAlpha,
    APCA_TARGET_SELECTION_OVERLAY,
  );

  const nameInfo = themeNames(paletteKind, paletteStyle);

  return {
    semanticColors,
    isDarkMode,
    type: isDarkMode ? "dark" : "light",
    name: isDarkMode ? nameInfo.dark : nameInfo.light,
    displayName: `${nameInfo.displayName} ${isDarkMode ? "Dark" : "Light"}`,
    description: buildDescription(
      nameInfo.displayName,
      personality.lensName,
      personality.paletteCharacter,
      isDarkMode,
    ),
    author: "color-palette-pro / code-mode",
    peakAlpha,
    inactiveSelectionStyle: sp.inactiveSelectionStyle,
    fontStyleProfile: personality.fontStyleProfile,
  };
}

export function generateCodeTheme(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = "square",
): CodeThemeOutput {
  const data = buildThemeData(
    baseColor,
    palette,
    isDarkMode,
    paletteKind,
    paletteStyle,
  );
  const {
    semanticColors,
    type,
    name,
    displayName,
    description,
    author,
    peakAlpha,
    inactiveSelectionStyle,
    fontStyleProfile,
  } = data;
  const uiColors = deriveUiColors(semanticColors, isDarkMode, {
    peakAlpha,
    inactiveSelectionStyle,
  });
  const baseTokenRules = generateBaseTokenRules(
    semanticColors,
    fontStyleProfile ?? undefined,
  );
  const semanticTokenRules = generateSemanticTokenRules(
    semanticColors,
    fontStyleProfile ?? undefined,
  );
  return {
    $schema: "vscode://schemas/color-theme",
    name,
    displayName,
    description,
    author,
    type,
    semanticHighlighting: true,
    colors: uiColors,
    tokenColors: baseTokenRules,
    semanticTokenColors: semanticTokenRules,
  };
}

// ===== UNIFIED FORMAT API =====

/**
 * Generate a theme in the specified format, serialized to a string ready to write to disk.
 * - vscode: JSON (.json) — load via Extensions > Install from VSIX or drop in themes dir
 * - zed: JSON (.json) — place in ~/.config/zed/themes/
 * - iterm2: XML plist (.itermcolors) — import via iTerm2 > Preferences > Colors
 * - ghostty: config snippet — paste into ~/.config/ghostty/config
 */
export function generateTheme(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = "square",
  format: ThemeFormat = "vscode",
): string {
  const data = buildThemeData(
    baseColor,
    palette,
    isDarkMode,
    paletteKind,
    paletteStyle,
  );
  switch (format) {
    case "vscode": {
      const {
        semanticColors,
        type,
        name,
        displayName,
        description,
        author,
        peakAlpha,
        inactiveSelectionStyle,
        fontStyleProfile,
      } = data;
      const uiColors = deriveUiColors(semanticColors, isDarkMode, {
        peakAlpha,
        inactiveSelectionStyle,
      });
      const baseTokenRules = generateBaseTokenRules(
        semanticColors,
        fontStyleProfile ?? undefined,
      );
      const semanticTokenRules = generateSemanticTokenRules(
        semanticColors,
        fontStyleProfile ?? undefined,
      );
      const output: CodeThemeOutput = {
        $schema: "vscode://schemas/color-theme",
        name,
        displayName,
        description,
        author,
        type,
        semanticHighlighting: true,
        colors: uiColors,
        tokenColors: baseTokenRules,
        semanticTokenColors: semanticTokenRules,
      };
      return JSON.stringify(output, null, 2);
    }
    case "zed": {
      const nameInfo = themeNames(paletteKind, paletteStyle);
      const zedOutput: ZedThemeOutput = {
        $schema: "https://zed.dev/schema/themes/v0.2.0.json",
        name: nameInfo.displayName,
        author: "color-palette-pro / code-mode",
        themes: [serializeAsZed(data)],
      };
      return JSON.stringify(zedOutput, null, 2);
    }
    case "iterm2":
      return serializeAsIterm2(data);
    case "ghostty":
      return serializeAsGhostty(data);
    case "warp":
      return serializeAsWarp(data);
    case "alacritty":
      return serializeAsAlacritty(data);
  }
}

/** Generate dark and light variants for the given format. */
export function generateThemePair(
  baseColor: Color,
  palette: BaseColorData[],
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = "square",
  format: ThemeFormat = "vscode",
): { dark: string; light: string } {
  return {
    dark: generateTheme(
      baseColor,
      palette,
      true,
      paletteKind,
      paletteStyle,
      format,
    ),
    light: generateTheme(
      baseColor,
      palette,
      false,
      paletteKind,
      paletteStyle,
      format,
    ),
  };
}

export function generateCodeThemePair(
  baseColor: Color,
  palette: BaseColorData[],
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = "square",
): { dark: CodeThemeOutput; light: CodeThemeOutput } {
  return {
    dark: generateCodeTheme(
      baseColor,
      palette,
      true,
      paletteKind,
      paletteStyle,
    ),
    light: generateCodeTheme(
      baseColor,
      palette,
      false,
      paletteKind,
      paletteStyle,
    ),
  };
}

export function serializeTheme(theme: CodeThemeOutput): string {
  return JSON.stringify(theme, null, 2);
}

export function serializeThemePair(pair: {
  dark: CodeThemeOutput;
  light: CodeThemeOutput;
}): string {
  return JSON.stringify(pair, null, 2);
}
