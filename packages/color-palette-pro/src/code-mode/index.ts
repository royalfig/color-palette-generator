import Color from 'colorjs.io'
import { PaletteKinds, PaletteStyle } from '../types/types'
import { generateOutlineAndInverse } from '../ui/outline'
import { generateSemanticColors } from '../ui/semantic'
import { generateSurfaceColors, makeContainerForAccent } from '../ui/surface'
import { adaptPrimaryForMode, surfaceTreatmentFor } from '../ui/uiUtils'
import { deriveAnsiPalette } from './ansi'
import { APCA_TARGET_SELECTION_OVERLAY } from './constants'
import { serializeAsAlacritty } from './formats/alacritty'
import { serializeAsGhostty } from './formats/ghostty'
import { serializeAsIterm2 } from './formats/iterm2'
import { buildVscodeTheme, serializeAsVscode } from './formats/vscode'
import { serializeAsWarp } from './formats/warp'
import { serializeAsZed } from './formats/zed'
import { intensityChromaFor } from './intensity'
import { themeNames } from './names'
import { legibleOverlayAlpha } from './overlay'
import { getPersonalityConfig } from './personality'
import { buildSyntax } from './syntax'
import { analogousTemplate } from './templates/analogous'
// templates/base imports removed since they are moved to vscode format
import { complementaryTemplate } from './templates/complementary'
import { splitComplementaryTemplate } from './templates/splitcomp'
import { tetradicTemplate } from './templates/tetradic'
import { tintsAndShadesTemplate } from './templates/tintsAndShades'
import { triadicTemplate } from './templates/triadic'
import type {
  BaseColorData,
  CodeThemeOutput,
  CodeThemeTemplate,
  SemanticColors,
  SurfaceBundle,
  ThemeData,
  ThemeFormat,
  ZedThemeOutput,
} from './types'
import { desaturate, findColorByHue, hueGapDeg, hueSpreadDeg, mixColors, tintTowardHue, toHex } from './utils'

const templateRegistry: Record<PaletteKinds, CodeThemeTemplate> = {
  ana: analogousTemplate,
  com: complementaryTemplate,
  spl: splitComplementaryTemplate,
  tet: tetradicTemplate,
  tri: triadicTemplate,
  tas: tintsAndShadesTemplate,
}

function buildThemeData(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): ThemeData {
  const template = templateRegistry[paletteKind]
  if (!template) throw new Error(`Unknown palette kind: ${paletteKind}`)

  const personality = getPersonalityConfig(paletteKind, paletteStyle, palette)

  const rawPrimary = (palette.filter(p => p.isBase)[0].color ?? baseColor).clone()
  const primary = adaptPrimaryForMode(rawPrimary, isDarkMode)

  // Seed-driven palette intensity (audit note 3): the base color's chroma — not the palette
  // kind — sets how saturated the ANSI core and the Aurora semantics run (see intensity.ts).
  const intensityChroma = intensityChromaFor(rawPrimary.oklch.c ?? 0, paletteStyle)

  const treatment = surfaceTreatmentFor(paletteStyle)
  const surfaceTones = generateSurfaceColors(primary, isDarkMode, treatment)
  const { outline, outlineVariant } = generateOutlineAndInverse(
    primary,
    isDarkMode,
    surfaceTones.surface,
    surfaceTones.onSurface,
    treatment,
  )
  const surfaces: SurfaceBundle = { ...surfaceTones, outline, outlineVariant }

  const sp = personality.surfaceProfile

  // Passthrough: code-mode chrome uses the UI surface stack directly — the same style-aware
  // surfaces the app palette gets (square neutral → diamond brutalist) — instead of the old
  // per-lens editor-depth + chrome-chroma overrides. The editor is the page surface; sidebar /
  // panel recede to the sunken well; overlays and inputs sit on the floating/sunken tiers. Kind
  // identity now lives in the syntax bands and the surface hue (which follows the base color),
  // not in a bespoke editor-bg tint.
  const editorBgBase = surfaces.surface.clone()
  const sidebarBg = surfaces.containerSunken.clone()
  const panelBg = sidebarBg.clone()
  const overlayBg = surfaces.containerOverlay.clone()
  const inputSunken = surfaces.containerSunken.clone()

  // Status bar: chrome, not brand. It reads as the bottom edge of the window frame, so it
  // inherits the same sunken container the sidebar / title bar / tab bar use rather than a
  // branded primary-container wash — a lighter tinted bar there fights the editor for
  // attention and breaks the frame's single plane. Border falls back to the divider.
  const statusBarBg = sidebarBg.clone()

  const divider = outlineVariant.clone()

  const neutralBandBase = isDarkMode
    ? mixColors(surfaces.container, surfaces.containerOverlay, 0.5)
    : mixColors(surfaces.surface, surfaces.containerSunken, 0.4)
  const neutralBand =
    sp.neutralBandTint > 0
      ? tintTowardHue(neutralBandBase, primary.oklch.h ?? 0, sp.neutralBandTint, 0.008)
      : neutralBandBase

  // Aurora functional tier: error/warning/success keep their canonical hue (they must still
  // read as error/warning/success) but adopt the seed's saturation, and — when the palette is a
  // tight single family (hue spread < 90°: analogous, or any monochrome) — lean a few degrees
  // toward the base so they belong. Palette-driven: keyed off the actual hue spread, not a
  // hardcoded kind.
  const paletteHues = palette
    .map(p => p?.color)
    .filter((c): c is Color => !!c && (c.oklch.c ?? 0) > 0.03)
    .map(c => c.oklch.h ?? 0)
  const inFamilySemantics = paletteHues.length < 2 || hueSpreadDeg(paletteHues) < 90
  const semantics = generateSemanticColors(primary, palette, isDarkMode, editorBgBase, {
    chromaTarget: intensityChroma,
    familyHue: primary.oklch.h ?? undefined,
    leanCap: inFamilySemantics ? 10 : 0,
  })

  const primaryContainerPair = makeContainerForAccent(primary, isDarkMode)
  const errorContainerPair = makeContainerForAccent(semantics.error, isDarkMode)
  const warningContainerPair = makeContainerForAccent(semantics.warning, isDarkMode)
  const successContainerPair = makeContainerForAccent(semantics.success, isDarkMode)

  const SECONDARY_INDEX: Record<PaletteKinds, number> = {
    com: 5,
    spl: 3,
    tri: 3,
    tet: 3,
    ana: 2,
    tas: 3,
  }
  const secondaryPaletteIdx = SECONDARY_INDEX[paletteKind] ?? 1
  const secondaryRaw = (
    palette[secondaryPaletteIdx]?.color ??
    (() => {
      const c = primary.clone()
      c.oklch.h = ((c.oklch.h ?? 0) + 60) % 360
      return c
    })()
  ).clone()
  secondaryRaw.oklch.l = isDarkMode ? 0.8 : 0.4
  secondaryRaw.oklch.c = Math.min(secondaryRaw.oklch.c ?? 0, 0.08)
  const secondaryContainerPair = makeContainerForAccent(secondaryRaw, isDarkMode)
  const onSecondary = (() => {
    const t = secondaryRaw.clone()
    t.oklch.l = isDarkMode ? 0.12 : 0.95
    return t
  })()

  // Info/link/ANSI-blue must read as *blue* (h ~205–255). Prefer a real blue palette
  // member, but pin the hue into the blue band when the palette has none — a green
  // "info" colour breaks links and ANSI 4 (the chartreuse-complement failure mode).
  const infoFromPalette = findColorByHue(palette, 235, 30)
  const infoColor = (
    infoFromPalette ??
    (() => {
      const fb = primary.clone()
      fb.oklch.c = Math.min((primary.oklch.c ?? 0) * 0.9, 0.13)
      return fb
    })()
  ).clone()
  {
    const signed = (((infoColor.oklch.h ?? 235) - 235 + 540) % 360) - 180
    infoColor.oklch.h = (235 + Math.max(-30, Math.min(30, signed)) + 360) % 360
  }
  infoColor.oklch.l = isDarkMode ? 0.75 : 0.45
  const infoContainerPair = makeContainerForAccent(infoColor, isDarkMode)

  // Push the template's palette-derived per-role colors through the legibility pipeline (syntax.ts):
  // readability normalize → comment hue → contrast floor → L/C distinction → mono pin. The template's
  // role→swatch assignment and the palette's hues are preserved; the pipeline only makes them
  // legible and distinct (no convention re-permutation, no exemplar band-squeeze).
  const rawSyntax = template.deriveColors(baseColor, palette, isDarkMode, surfaces)
  const syntax = buildSyntax(rawSyntax, {
    bg: editorBgBase,
    isDarkMode,
    isMono: personality.paletteCharacter === 'mono',
    monoHue: primary.oklch.h ?? NaN,
  })

  const rawBracketPairs = template.deriveBracketPairs(baseColor, palette, isDarkMode)
  const bracketPairColors = rawBracketPairs.map(toHex)

  const markdownQuote = desaturate(syntax.stringColor.clone(), 0.4)

  // Comments are solid in both modes — every exemplar uses opaque comment colors,
  // and the recessed feel now comes from the APCA comment band instead of alpha.
  const commentHex = toHex(syntax.commentColor)
  const punctuationHex = toHex(syntax.punctuationColor)

  const cursorColor = sp.cursorSource === 'foreground' ? surfaces.onSurface.clone() : syntax.accentColor.clone()

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
    ]
    let best: Color | null = null
    let bestGap = Infinity
    for (const c of candidates) {
      if ((c.oklch.c ?? 0) < 0.05) continue
      const g = hueGapDeg(c.oklch.h ?? 0, 265)
      if (g < bestGap) {
        bestGap = g
        best = c
      }
    }
    return (best ?? primary).clone()
  })()

  // Editor foreground: tinted themes carry the bg hue into the fg at a whisper
  // (corpus Δhue vs bg ≤ 16°, C median ≈ 0.02); the neutral school stays at C 0.
  //
  // NOT a straight passthrough of the UI on-surface token any more. That token is solved for
  // maximum readability of app chrome and lands near-black on a light ground (median 19.7:1,
  // where every reference editor theme sits at 8-14.7:1). In an editor that inverts the
  // hierarchy: plain identifiers out-contrast the syntax colours that are supposed to lead the
  // eye (measured median loud-minus-variable APCA was -10.3 Lc). The canvas text is the
  // *baseline*, not the loudest thing on screen, so pull it back toward the ground until it sits
  // at the top of the corpus range rather than past it.
  const editorFg = (() => {
    const fg = surfaces.onSurface.clone()
    const bg = editorBgBase
    const TARGET = 12 // WCAG 2.1 contrast ratio; corpus runs 8-14.7:1
    if (fg.contrastWCAG21(bg) <= TARGET) return fg
    const bgL = bg.oklch.l ?? (isDarkMode ? 0.3 : 0.99)
    let lo = fg.oklch.l ?? 0.5
    let hi = bgL
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2
      const probe = fg.clone()
      probe.oklch.l = mid
      if (probe.contrastWCAG21(bg) > TARGET) lo = mid
      else hi = mid
    }
    fg.oklch.l = lo
    return fg
  })()

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
  })

  // Source colour for the selection / highlight ramp. Deliberately NOT the raw focus accent:
  // a bright accent has to be held at a very low alpha to keep glyphs readable, which makes the
  // selection itself nearly invisible. Pulling the tint toward the editor ground first (the way
  // VS Code's #264F78-on-#1F1F1F selection does) buys a higher alpha at the same text legibility,
  // so the selection reads as a solid block without washing out the code inside it.
  const selectionTint = (() => {
    const t = uiAccent.clone()
    const bgL = editorBgBase.oklch.l ?? (isDarkMode ? 0.2 : 0.98)
    const l = t.oklch.l ?? 0.5
    t.oklch.l = isDarkMode ? Math.min(l, bgL + 0.24) : Math.max(l, bgL - 0.22)
    return t
  })()

  const semanticColors: SemanticColors = {
    editorBackground: { hex: toHex(editorBgBase) },
    editorForeground: { hex: toHex(editorFg) },
    sidebarBackground: { hex: toHex(sidebarBg) },
    panelBackground: { hex: toHex(panelBg) },
    overlayBackground: { hex: toHex(overlayBg) },
    statusBarBackground: { hex: toHex(statusBarBg) },
    focusBorder: { hex: toHex(uiAccent) },
    selectionTint: { hex: toHex(selectionTint) },
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

    errorForeground: { hex: toHex(semantics.errorText) },
    errorContainer: { hex: toHex(errorContainerPair.container) },
    onErrorContainer: { hex: toHex(errorContainerPair.onContainer) },
    warningForeground: { hex: toHex(semantics.warningText) },
    warningContainer: { hex: toHex(warningContainerPair.container) },
    onWarningContainer: { hex: toHex(warningContainerPair.onContainer) },
    infoForeground: { hex: toHex(infoColor) },
    infoContainer: { hex: toHex(infoContainerPair.container) },
    onInfoContainer: { hex: toHex(infoContainerPair.onContainer) },
    successForeground: { hex: toHex(semantics.successText) },
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
  }

  const peakStartAlpha = isDarkMode ? sp.peakAlpha.dark : sp.peakAlpha.light
  // Solve the selection alpha against every token that can actually sit inside a selection —
  // the loud syntax roles and the quiet ones — not just editorForeground, which is the token
  // least at risk of being washed out.
  const peakAlpha = legibleOverlayAlpha(
    semanticColors.selectionTint.hex,
    semanticColors.editorBackground.hex,
    [
      semanticColors.editorForeground.hex,
      semanticColors.keywordColor.hex,
      semanticColors.stringColor.hex,
      semanticColors.typeColor.hex,
      semanticColors.numberColor.hex,
      semanticColors.definitionColor.hex,
      semanticColors.regexColor.hex,
      semanticColors.accentColor.hex,
      semanticColors.variableColor.hex,
      semanticColors.propertyColor.hex,
      semanticColors.operatorColor.hex,
      semanticColors.punctuationColor.hex,
      semanticColors.commentColor.hex,
    ],
    peakStartAlpha,
    APCA_TARGET_SELECTION_OVERLAY,
  )

  const nameInfo = themeNames(paletteKind, paletteStyle)

  return {
    semanticColors,
    isDarkMode,
    type: isDarkMode ? 'dark' : 'light',
    name: isDarkMode ? nameInfo.dark : nameInfo.light,
    displayName: `${nameInfo.displayName} ${isDarkMode ? 'Dark' : 'Light'}`,
    description: `A ${isDarkMode ? 'dark' : 'light'} ${nameInfo.displayName} theme generated from the base color ${toHex(baseColor)} and a ${paletteStyle} ${paletteKind} palette`,
    author: '@royalfig',
    peakAlpha,
    inactiveSelectionStyle: sp.inactiveSelectionStyle,
    fontStyleProfile: personality.fontStyleProfile,
  }
}

export interface ThemeOptions {
  /** The base or seed color used to generate the palette (as a Color object or string). */
  baseColor: Color | string;
  /** The generated palette data array. */
  palette: BaseColorData[];
  /** Whether the theme is for dark mode (true) or light mode (false). */
  isDarkMode: boolean;
  /** The kind of palette being used (e.g., 'ana' for analogous, 'com' for complementary). */
  paletteKind: PaletteKinds;
  /** The geometric style applied to the palette (default: 'square'). */
  paletteStyle?: PaletteStyle;
}

/**
 * Generates a code theme object for VSCode.
 * 
 * @param options - Configuration options for the code theme.
 * @returns A JSON-serializable VSCode theme object.
 */
export function generateCodeTheme(options: ThemeOptions): CodeThemeOutput {
  const { baseColor, palette, isDarkMode, paletteKind, paletteStyle = 'square' } = options;
  const color = typeof baseColor === 'string' ? new Color(baseColor) : baseColor;
  const data = buildThemeData(color, palette, isDarkMode, paletteKind, paletteStyle);
  return buildVscodeTheme(data);
}

// ===== UNIFIED FORMAT API =====

export interface FormatThemeOptions extends ThemeOptions {
  /** The specific editor or terminal format to generate (default: 'vscode'). */
  format?: ThemeFormat;
}

/**
 * Generates a theme in the specified format, serialized to a string ready to write to disk.
 * - vscode: JSON (.json) — load via Extensions > Install from VSIX or drop in themes dir
 * - zed: JSON (.json) — place in ~/.config/zed/themes/
 * - iterm2: XML plist (.itermcolors) — import via iTerm2 > Preferences > Colors
 * - ghostty: config snippet — paste into ~/.config/ghostty/config
 * 
 * @param options - Configuration options including the output format.
 * @returns The serialized theme string.
 */
export function generateTheme(options: FormatThemeOptions): string {
  const { baseColor, palette, isDarkMode, paletteKind, paletteStyle = 'square', format = 'vscode' } = options;
  const color = typeof baseColor === 'string' ? new Color(baseColor) : baseColor;
  const data = buildThemeData(color, palette, isDarkMode, paletteKind, paletteStyle);
  switch (format) {
    case 'vscode':
      return serializeAsVscode(data);
    case 'zed': {
      const nameInfo = themeNames(paletteKind, paletteStyle);
      const zedOutput: ZedThemeOutput = {
        $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
        name: nameInfo.displayName,
        author: '@royalfig',
        themes: [serializeAsZed(data)],
      };
      return JSON.stringify(zedOutput, null, 2);
    }
    case 'iterm2':
      return serializeAsIterm2(data);
    case 'ghostty':
      return serializeAsGhostty(data);
    case 'warp':
      return serializeAsWarp(data);
    case 'alacritty':
      return serializeAsAlacritty(data);
  }
}

export type ThemePairOptions = Omit<ThemeOptions, 'isDarkMode'>;
export type FormatThemePairOptions = Omit<FormatThemeOptions, 'isDarkMode'>;

/**
 * Generates both dark and light variants of a theme in the specified format.
 * 
 * @param options - Configuration options for the theme pair.
 * @returns An object containing the serialized light and dark themes.
 */
export function generateThemePair(options: FormatThemePairOptions): { dark: string; light: string } {
  return {
    dark: generateTheme({ ...options, isDarkMode: true }),
    light: generateTheme({ ...options, isDarkMode: false }),
  };
}

/**
 * Generates both dark and light variants of a VSCode code theme.
 * 
 * @param options - Configuration options for the theme pair.
 * @returns An object containing the raw VSCode theme objects for dark and light modes.
 */
export function generateCodeThemePair(options: ThemePairOptions): { dark: CodeThemeOutput; light: CodeThemeOutput } {
  return {
    dark: generateCodeTheme({ ...options, isDarkMode: true }),
    light: generateCodeTheme({ ...options, isDarkMode: false }),
  };
}

/**
 * Serializes a VSCode code theme object into a formatted JSON string.
 * 
 * @param theme - The VSCode code theme object.
 * @returns The serialized JSON string.
 */
export function serializeTheme(theme: CodeThemeOutput): string {
  return JSON.stringify(theme, null, 2);
}

/**
 * Serializes a pair of VSCode code themes into a formatted JSON string.
 * 
 * @param pair - An object containing dark and light VSCode code theme objects.
 * @returns The serialized JSON string.
 */
export function serializeThemePair(pair: { dark: CodeThemeOutput; light: CodeThemeOutput }): string {
  return JSON.stringify(pair, null, 2);
}
