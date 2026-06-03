import Color from 'colorjs.io'
import { PaletteKinds, PaletteStyle } from '../types'
import type {
  BaseColorData,
  CodeThemeOutput,
  CodeThemeTemplate,
  PaletteCharacter,
  PersonalityContrastProfile,
  SemanticColors,
  SurfaceBundle,
  SyntaxColors,
  ThemeData,
  ThemeFormat,
  ZedThemeOutput,
} from './types'
import { serializeAsZed } from './formats/zed'
import { serializeAsIterm2 } from './formats/iterm2'
import { serializeAsGhostty } from './formats/ghostty'
import { analogousTemplate } from './templates/analogous'
import { complementaryTemplate } from './templates/complementary'
import { splitComplementaryTemplate } from './templates/split-complementary'
import { tetradicTemplate } from './templates/tetradic'
import { triadicTemplate } from './templates/triadic'
import { tintsAndShadesTemplate } from './templates/tints-and-shades'
import { tonesTemplate } from './templates/tones'
import { deriveUiColors, generateBaseTokenRules, generateSemanticTokenRules } from './templates/base'
import { generateSurfaceColors, generateSemanticColors, adaptPrimaryForMode, makeContainerForAccent } from '../ui'
import {
  findColorByHue, toHex, shiftHue, desaturate, withAlpha,
  ensureAPCAAgainst, deltaE, nudgeForDistinction, mixColors, tintTowardHue,
} from './utils'
import { getPersonalityConfig } from './personality'

const templateRegistry: Record<PaletteKinds, CodeThemeTemplate> = {
  ana: analogousTemplate,
  com: complementaryTemplate,
  spl: splitComplementaryTemplate,
  tet: tetradicTemplate,
  tri: triadicTemplate,
  tas: tintsAndShadesTemplate,
  ton: tonesTemplate,
}

const nameSuggestions: Record<PaletteKinds, { dark: string; light: string; displayName: string }> = {
  ana: { dark: 'analogous-dark', light: 'analogous-light', displayName: 'Analogous' },
  com: { dark: 'complementary-dark', light: 'complementary-light', displayName: 'Complementary' },
  spl: { dark: 'split-complementary-dark', light: 'split-complementary-light', displayName: 'Split Complementary' },
  tet: { dark: 'tetradic-dark', light: 'tetradic-light', displayName: 'Tetradic' },
  tri: { dark: 'triadic-dark', light: 'triadic-light', displayName: 'Triadic' },
  tas: { dark: 'tints-and-shades-dark', light: 'tints-and-shades-light', displayName: 'Tints & Shades' },
  ton: { dark: 'tones-dark', light: 'tones-light', displayName: 'Tones' },
}

const LOUD_ROLES = ['definitionColor', 'keywordColor', 'typeColor', 'stringColor', 'numberColor', 'regexColor', 'accentColor'] as const
const QUIET_ROLES = ['variableColor', 'propertyColor', 'operatorColor', 'punctuationColor', 'commentColor'] as const

// Roles whose visual distinctness matters, ordered by typical token frequency in code.
// Frequency-weighted enforcement: high-frequency roles claim hue space first; less-frequent
// roles adapt around them. keyword and string dominate most languages; type is rarest.
const DISTINCT_ROLES_BY_FREQ = ['keywordColor', 'stringColor', 'definitionColor', 'numberColor', 'typeColor'] as const

// APCA contrast targets (perceptual; Lc scale):
//   75 = body text (the gold standard)
//   60 = fluent text (acceptable for syntax tokens)
//   45 = incidental UI text
//   30 = decorative / spot text
const APCA_TARGET_LOUD = 60
const APCA_TARGET_QUIET = 45
const APCA_TARGET_SELECTION_OVERLAY = 30

// Alpha is applied selectively. In light mode, compositing over near-white bg drags any
// foreground toward white and kills contrast — so we use solid colors there. In dark mode,
// alpha lets comments retain palette tint while gracefully receding.
//
// Punctuation gets no alpha at all in either mode — it's already at the quiet L band, and
// adding transparency on top makes it invisible (especially in light themes).
const COMMENT_ALPHA_DARK = 0.78

/**
 * Apply personality contrast profile to syntax colors. Loud and quiet roles scale
 * differently — quiet roles desaturate regardless of profile direction so the loud/quiet
 * gap widens whenever any personality is active.
 */
function applyContrastProfile(syntax: SyntaxColors, profile: PersonalityContrastProfile, isDarkMode: boolean): SyntaxColors {
  const [loudLMin, loudLMax] = isDarkMode ? [0.60, 0.92] : [0.30, 0.70]
  const [quietLMin, quietLMax] = isDarkMode ? [0.55, 0.82] : [0.32, 0.60]

  const scaleLoud = (color: Color): Color => {
    const c = color.clone()
    c.oklch.l = Math.max(loudLMin, Math.min(loudLMax, (c.oklch.l ?? 0.75) * profile.fgLightnessScale))
    c.oklch.c = Math.min(0.25, Math.max(0.04, (c.oklch.c ?? 0.1) * profile.chromaScale))
    return c
  }
  const QUIET_DESAT = 0.65
  const quarterScale = 1 + (profile.fgLightnessScale - 1) * 0.25
  const scaleQuiet = (color: Color): Color => {
    const c = color.clone()
    c.oklch.l = Math.max(quietLMin, Math.min(quietLMax, (c.oklch.l ?? 0.7) * quarterScale))
    c.oklch.c = Math.min(0.06, (c.oklch.c ?? 0.04) * QUIET_DESAT)
    return c
  }

  const out = { ...syntax }
  for (const k of LOUD_ROLES) (out as any)[k] = scaleLoud((syntax as any)[k])
  for (const k of QUIET_ROLES) (out as any)[k] = scaleQuiet((syntax as any)[k])
  return out
}

/**
 * Walk each role and bump along L until it meets a perceptual contrast target (APCA Lc)
 * against the *actual* editor background. Loud roles target Lc 60, quiet roles Lc 45.
 */
function ensureRoleContrast(syntax: SyntaxColors, bg: Color): SyntaxColors {
  const out = { ...syntax }
  for (const k of LOUD_ROLES) (out as any)[k] = ensureAPCAAgainst((syntax as any)[k], bg, APCA_TARGET_LOUD)
  for (const k of QUIET_ROLES) (out as any)[k] = ensureAPCAAgainst((syntax as any)[k], bg, APCA_TARGET_QUIET)
  return out
}

/**
 * Frequency-weighted distinction. Iterate DISTINCT_ROLES in descending token-frequency
 * order; high-frequency roles "anchor" the hue space and lower-frequency roles nudge
 * around them. Two passes catch second-order collisions.
 */
function enforceDistinction(syntax: SyntaxColors, isDarkMode: boolean, minDeltaE = 8): SyntaxColors {
  const out = { ...syntax }
  const roles = DISTINCT_ROLES_BY_FREQ
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const a = (out as any)[roles[i]] as Color
        const b = (out as any)[roles[j]] as Color
        if (deltaE(a, b) < minDeltaE) {
          (out as any)[roles[j]] = nudgeForDistinction(b, a, isDarkMode)
        }
      }
    }
  }
  return out
}

/**
 * Composite a foreground color over a background using straight alpha blending.
 * Used to check the *effective* color of a translucent overlay.
 */
function compositeOver(fgHex: string, bgHex: string, alpha: number): Color {
  const fg = new Color(fgHex).to('srgb')
  const bg = new Color(bgHex).to('srgb')
  if (!fg || !bg) return new Color(fgHex)
  const r = (fg.coords[0] ?? 0) * alpha + (bg.coords[0] ?? 0) * (1 - alpha)
  const g = (fg.coords[1] ?? 0) * alpha + (bg.coords[1] ?? 0) * (1 - alpha)
  const b = (fg.coords[2] ?? 0) * alpha + (bg.coords[2] ?? 0) * (1 - alpha)
  return new Color('srgb', [r, g, b])
}

/**
 * For a translucent overlay (e.g. selectionBackground), find the smallest alpha at which
 * the composited overlay-on-bg still meets minLc APCA against the syntax foreground.
 * If startAlpha already passes, return it unchanged.
 */
function legibleOverlayAlpha(
  overlayHex: string,
  bgHex: string,
  fgHex: string,
  startAlpha: number,
  minLc: number,
  maxAlpha = 0.85,
): number {
  let alpha = startAlpha
  for (let i = 0; i < 8; i++) {
    const composited = compositeOver(overlayHex, bgHex, alpha)
    if (Math.abs(composited.contrastAPCA(new Color(fgHex))) >= minLc) return alpha
    if (alpha >= maxAlpha) return maxAlpha
    alpha = Math.min(maxAlpha, alpha + (maxAlpha - alpha) * 0.4)
  }
  return alpha
}

function deriveOutline(primary: Color, isDarkMode: boolean): { outline: Color; outlineVariant: Color } {
  const baseHue = primary.oklch.h ?? 0
  // `outline` stays visible — reserved for peekView / panel seams where we want
  // a real line. Chrome borders should use `outlineVariant` (see deriveUiColors).
  const outline = primary.clone()
  outline.oklch.h = baseHue
  outline.oklch.c = 0.005
  outline.oklch.l = isDarkMode ? 0.32 : 0.78

  // outlineVariant is the "barely there" tone used for almost every widget border
  // in modern themes — sits just above editor L in dark, just below white in light.
  const outlineVariant = primary.clone()
  outlineVariant.oklch.h = baseHue
  outlineVariant.oklch.c = 0.005
  outlineVariant.oklch.l = isDarkMode ? 0.20 : 0.92

  return { outline, outlineVariant }
}

const CHARACTER_PROSE: Record<PaletteCharacter, string> = {
  serene: 'calm and balanced',
  vivid: 'high-contrast and dramatic',
  crisp: 'structured and medium-energy',
  mono: 'monochromatic and moody',
}

function buildDescription(displayName: string, lensName: string, character: PaletteCharacter, isDarkMode: boolean): string {
  const mode = isDarkMode ? 'dark' : 'light'
  return `${displayName} in the ${lensName} lens — a ${CHARACTER_PROSE[character]} ${mode} theme generated from a ${displayName.toLowerCase()} palette.`
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

  const personality = getPersonalityConfig(paletteKind, paletteStyle)

  const rawPrimary = (palette[0]?.color ?? baseColor).clone()
  const primary = adaptPrimaryForMode(rawPrimary, isDarkMode)

  const surfaceTones = generateSurfaceColors(primary, isDarkMode)
  const { outline, outlineVariant } = deriveOutline(primary, isDarkMode)
  const surfaces: SurfaceBundle = { ...surfaceTones, outline, outlineVariant }

  const sp = personality.surfaceProfile
  const editorBgBase = surfaces.surface.clone()
  editorBgBase.oklch.l = isDarkMode ? sp.editorLDark : sp.editorLLight
  if (personality.bgTint) {
    editorBgBase.oklch.h = primary.oklch.h
    if (isDarkMode) {
      editorBgBase.oklch.c = Math.min((editorBgBase.oklch.c ?? 0) + personality.bgTint.chromaBoost * 0.5, 0.025)
    } else {
      editorBgBase.oklch.c = Math.min((editorBgBase.oklch.c ?? 0) + personality.bgTint.chromaBoost * 0.5, 0.012)
    }
  }
  if (personality.contrastProfile) {
    const modeOffset = isDarkMode
      ? personality.contrastProfile.bgLightnessOffsetDark
      : personality.contrastProfile.bgLightnessOffsetLight
    const [lMin, lMax] = isDarkMode ? [0.12, 0.22] : [0.95, 1.00]
    editorBgBase.oklch.l = Math.max(lMin, Math.min(lMax, (editorBgBase.oklch.l ?? 0.17) + modeOffset))
  }

  const sidebarRouteKey = isDarkMode ? sp.sidebarSurface.dark : sp.sidebarSurface.light
  const sidebarBg = (sidebarRouteKey === 'container' ? surfaces.container : surfaces.containerSunken).clone()
  if (sp.chromeTint) {
    sidebarBg.oklch.h = primary.oklch.h
    sidebarBg.oklch.c = Math.min((sidebarBg.oklch.c ?? 0) + 0.006, isDarkMode ? 0.020 : 0.010)
  }
  const panelBg = sidebarBg.clone()
  const overlayBg = surfaces.containerOverlay

  const inputSunken = isDarkMode
    ? surfaces.containerOverlay.clone()
    : mixColors(surfaces.surface, surfaces.containerSunken, 0.3)

  const statusBarBg = primary.clone()
  let statusBarBorderTop: Color | undefined
  switch (sp.statusBarStyle) {
    case 'match-sidebar':
      statusBarBg.oklch.l = sidebarBg.oklch.l ?? (isDarkMode ? 0.18 : 0.96)
      statusBarBg.oklch.c = sidebarBg.oklch.c ?? 0
      statusBarBg.oklch.h = sidebarBg.oklch.h ?? primary.oklch.h
      break
    case 'tinted':
      statusBarBg.oklch.l = sidebarBg.oklch.l ?? (isDarkMode ? 0.18 : 0.96)
      statusBarBg.oklch.c = Math.min((primary.oklch.c ?? 0) * 0.15, isDarkMode ? 0.020 : 0.010)
      break
    case 'primary':
      statusBarBg.oklch.l = isDarkMode ? 0.22 : 0.88
      statusBarBg.oklch.c = Math.min((primary.oklch.c ?? 0) * 0.3, 0.05)
      break
    case 'primary-deep':
      statusBarBg.oklch.l = isDarkMode ? 0.22 : 0.85
      statusBarBg.oklch.c = Math.min((primary.oklch.c ?? 0) * 0.45, 0.07)
      statusBarBorderTop = primary.clone()
      break
  }

  const divider = outlineVariant.clone()

  const neutralBandBase = isDarkMode
    ? mixColors(surfaces.container, surfaces.containerOverlay, 0.5)
    : mixColors(surfaces.surface, surfaces.containerSunken, 0.4)
  const neutralBand = sp.neutralBandTint > 0
    ? tintTowardHue(neutralBandBase, primary.oklch.h ?? 0, sp.neutralBandTint, 0.008)
    : neutralBandBase

  const semantics = generateSemanticColors(primary, palette, isDarkMode, editorBgBase)

  const primaryContainerPair = makeContainerForAccent(primary, isDarkMode)
  const errorContainerPair = makeContainerForAccent(semantics.error, isDarkMode)
  const warningContainerPair = makeContainerForAccent(semantics.warning, isDarkMode)
  const successContainerPair = makeContainerForAccent(semantics.success, isDarkMode)

  const SECONDARY_INDEX: Record<PaletteKinds, number> = {
    com: 5, spl: 3, tri: 3, tet: 3, ana: 2, tas: 3, ton: 1,
  }
  const secondaryPaletteIdx = SECONDARY_INDEX[paletteKind] ?? 1
  const secondaryRaw = (palette[secondaryPaletteIdx]?.color ?? (() => {
    const c = primary.clone()
    c.oklch.h = ((c.oklch.h ?? 0) + 60) % 360
    return c
  })()).clone()
  secondaryRaw.oklch.l = isDarkMode ? 0.8 : 0.4
  secondaryRaw.oklch.c = Math.min(secondaryRaw.oklch.c ?? 0, 0.08)
  const secondaryContainerPair = makeContainerForAccent(secondaryRaw, isDarkMode)
  const onSecondary = (() => {
    const t = secondaryRaw.clone()
    t.oklch.l = isDarkMode ? 0.12 : 0.95
    return t
  })()

  const infoFromPalette = findColorByHue(palette, 220, 30)
  const infoColor = infoFromPalette ?? (() => {
    let best: Color | null = null
    let bestDist = Infinity
    for (const item of palette) {
      if (item?.color?.oklch?.h !== undefined) {
        const h = item.color.oklch.h ?? 0
        const dist = Math.min(Math.abs(h - 220), 360 - Math.abs(h - 220))
        if (dist < bestDist) {
          bestDist = dist
          best = item.color.clone()
        }
      }
    }
    if (best) return best
    const fb = primary.clone()
    fb.oklch.h = 220
    fb.oklch.c = Math.min((primary.oklch.c ?? 0) * 0.9, 0.13)
    return fb
  })()
  infoColor.oklch.l = isDarkMode ? 0.75 : 0.45
  const infoContainerPair = makeContainerForAccent(infoColor, isDarkMode)

  const rawSyntax = template.deriveColors(baseColor, palette, isDarkMode, surfaces)
  const styledSyntax = personality.contrastProfile
    ? applyContrastProfile(rawSyntax, personality.contrastProfile, isDarkMode)
    : rawSyntax
  const distinctSyntax = enforceDistinction(styledSyntax, isDarkMode)
  const syntax = ensureRoleContrast(distinctSyntax, editorBgBase)

  const rawBracketPairs = template.deriveBracketPairs(baseColor, palette, isDarkMode)
  const bracketPairColors = rawBracketPairs.map(toHex)

  const markdownQuote = desaturate(syntax.stringColor.clone(), 0.4)

  const commentHex = isDarkMode
    ? toHex(withAlpha(syntax.commentColor, COMMENT_ALPHA_DARK))
    : toHex(syntax.commentColor)
  const punctuationHex = toHex(syntax.punctuationColor)

  const cursorColor = sp.cursorSource === 'foreground'
    ? surfaces.onSurface.clone()
    : syntax.accentColor.clone()

  const semanticColors: SemanticColors = {
    editorBackground: { hex: toHex(editorBgBase) },
    editorForeground: { hex: toHex(surfaces.onSurface) },
    sidebarBackground: { hex: toHex(sidebarBg) },
    panelBackground: { hex: toHex(panelBg) },
    overlayBackground: { hex: toHex(overlayBg) },
    statusBarBackground: { hex: toHex(statusBarBg) },
    ...(statusBarBorderTop ? { statusBarBorderTop: { hex: toHex(statusBarBorderTop) } } : {}),
    focusBorder: { hex: toHex(primary) },
    inputBackground: { hex: toHex(panelBg) },
    inputSunken: { hex: toHex(inputSunken) },
    divider: { hex: toHex(divider) },
    outline: { hex: toHex(surfaces.outline) },
    outlineVariant: { hex: toHex(surfaces.outlineVariant) },
    neutralBand: { hex: toHex(neutralBand) },
    cursorColor: { hex: toHex(cursorColor) },

    defaultForeground: { hex: toHex(surfaces.onSurface) },
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

    terminalAnsiBlack: { hex: toHex(desaturate(surfaces.onSurface.clone(), 0.7)) },
    terminalAnsiRed: { hex: toHex(semantics.error) },
    terminalAnsiGreen: { hex: toHex(semantics.success) },
    terminalAnsiYellow: { hex: toHex(semantics.warning) },
    terminalAnsiBlue: { hex: toHex(infoColor) },
    terminalAnsiMagenta: { hex: toHex(shiftHue(syntax.definitionColor, 120)) },
    terminalAnsiCyan: { hex: toHex(shiftHue(syntax.definitionColor, -60)) },
    terminalAnsiWhite: { hex: toHex(surfaces.onSurface) },

    markdownHeadingColor: { hex: toHex(syntax.definitionColor) },
    markdownLinkColor: { hex: toHex(infoColor) },
    markdownQuoteColor: { hex: toHex(markdownQuote) },

    bracketPairColors,
  }

  const peakStartAlpha = isDarkMode ? sp.peakAlpha.dark : sp.peakAlpha.light
  const peakAlpha = legibleOverlayAlpha(
    semanticColors.focusBorder.hex,
    semanticColors.editorBackground.hex,
    semanticColors.editorForeground.hex,
    peakStartAlpha,
    APCA_TARGET_SELECTION_OVERLAY,
  )

  const nameInfo = nameSuggestions[paletteKind]

  return {
    semanticColors,
    isDarkMode,
    type: isDarkMode ? 'dark' : 'light',
    name: isDarkMode ? nameInfo.dark : nameInfo.light,
    displayName: `${nameInfo.displayName} ${isDarkMode ? 'Dark' : 'Light'}`,
    description: buildDescription(nameInfo.displayName, personality.lensName, personality.paletteCharacter, isDarkMode),
    author: 'color-palette-pro / code-mode',
    peakAlpha,
    inactiveSelectionStyle: sp.inactiveSelectionStyle,
    fontStyleProfile: personality.fontStyleProfile,
  }
}

export function generateCodeTheme(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): CodeThemeOutput {
  const data = buildThemeData(baseColor, palette, isDarkMode, paletteKind, paletteStyle)
  const { semanticColors, type, name, displayName, description, author, peakAlpha, inactiveSelectionStyle, fontStyleProfile } = data
  const uiColors = deriveUiColors(semanticColors, isDarkMode, { peakAlpha, inactiveSelectionStyle })
  const baseTokenRules = generateBaseTokenRules(semanticColors, fontStyleProfile ?? undefined)
  const semanticTokenRules = generateSemanticTokenRules(semanticColors, fontStyleProfile ?? undefined)
  return {
    $schema: 'vscode://schemas/color-theme',
    name,
    displayName,
    description,
    author,
    type,
    semanticHighlighting: true,
    colors: uiColors,
    tokenColors: baseTokenRules,
    semanticTokenColors: semanticTokenRules,
  }
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
  paletteStyle: PaletteStyle = 'square',
  format: ThemeFormat = 'vscode',
): string {
  const data = buildThemeData(baseColor, palette, isDarkMode, paletteKind, paletteStyle)
  switch (format) {
    case 'vscode': {
      const { semanticColors, type, name, displayName, description, author, peakAlpha, inactiveSelectionStyle, fontStyleProfile } = data
      const uiColors = deriveUiColors(semanticColors, isDarkMode, { peakAlpha, inactiveSelectionStyle })
      const baseTokenRules = generateBaseTokenRules(semanticColors, fontStyleProfile ?? undefined)
      const semanticTokenRules = generateSemanticTokenRules(semanticColors, fontStyleProfile ?? undefined)
      const output: CodeThemeOutput = {
        $schema: 'vscode://schemas/color-theme',
        name, displayName, description, author, type,
        semanticHighlighting: true,
        colors: uiColors,
        tokenColors: baseTokenRules,
        semanticTokenColors: semanticTokenRules,
      }
      return JSON.stringify(output, null, 2)
    }
    case 'zed': {
      const nameInfo = nameSuggestions[paletteKind]
      const zedOutput: ZedThemeOutput = {
        $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
        name: nameInfo.displayName,
        author: 'color-palette-pro / code-mode',
        themes: [serializeAsZed(data)],
      }
      return JSON.stringify(zedOutput, null, 2)
    }
    case 'iterm2': return serializeAsIterm2(data)
    case 'ghostty': return serializeAsGhostty(data)
  }
}

/** Generate dark and light variants for the given format. */
export function generateThemePair(
  baseColor: Color,
  palette: BaseColorData[],
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
  format: ThemeFormat = 'vscode',
): { dark: string; light: string } {
  return {
    dark: generateTheme(baseColor, palette, true, paletteKind, paletteStyle, format),
    light: generateTheme(baseColor, palette, false, paletteKind, paletteStyle, format),
  }
}

// ===== ZED =====

export function generateZedTheme(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): ZedThemeOutput {
  const data = buildThemeData(baseColor, palette, isDarkMode, paletteKind, paletteStyle)
  const nameInfo = nameSuggestions[paletteKind]
  return {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: nameInfo.displayName,
    author: 'color-palette-pro / code-mode',
    themes: [serializeAsZed(data)],
  }
}

export function generateZedThemePair(
  baseColor: Color,
  palette: BaseColorData[],
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): ZedThemeOutput {
  const dark = buildThemeData(baseColor, palette, true, paletteKind, paletteStyle)
  const light = buildThemeData(baseColor, palette, false, paletteKind, paletteStyle)
  const nameInfo = nameSuggestions[paletteKind]
  return {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: nameInfo.displayName,
    author: 'color-palette-pro / code-mode',
    themes: [serializeAsZed(dark), serializeAsZed(light)],
  }
}

// ===== ITERM2 =====

export function generateIterm2Theme(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): string {
  return serializeAsIterm2(buildThemeData(baseColor, palette, isDarkMode, paletteKind, paletteStyle))
}

export function generateIterm2ThemePair(
  baseColor: Color,
  palette: BaseColorData[],
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): { dark: string; light: string } {
  return {
    dark: serializeAsIterm2(buildThemeData(baseColor, palette, true, paletteKind, paletteStyle)),
    light: serializeAsIterm2(buildThemeData(baseColor, palette, false, paletteKind, paletteStyle)),
  }
}

// ===== GHOSTTY =====

export function generateGhosttyTheme(
  baseColor: Color,
  palette: BaseColorData[],
  isDarkMode: boolean,
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): string {
  return serializeAsGhostty(buildThemeData(baseColor, palette, isDarkMode, paletteKind, paletteStyle))
}

export function generateGhosttyThemePair(
  baseColor: Color,
  palette: BaseColorData[],
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): { dark: string; light: string } {
  return {
    dark: serializeAsGhostty(buildThemeData(baseColor, palette, true, paletteKind, paletteStyle)),
    light: serializeAsGhostty(buildThemeData(baseColor, palette, false, paletteKind, paletteStyle)),
  }
}

export function generateCodeThemePair(
  baseColor: Color,
  palette: BaseColorData[],
  paletteKind: PaletteKinds,
  paletteStyle: PaletteStyle = 'square',
): { dark: CodeThemeOutput; light: CodeThemeOutput } {
  return {
    dark: generateCodeTheme(baseColor, palette, true, paletteKind, paletteStyle),
    light: generateCodeTheme(baseColor, palette, false, paletteKind, paletteStyle),
  }
}

export function serializeTheme(theme: CodeThemeOutput): string {
  return JSON.stringify(theme, null, 2)
}

export function serializeThemePair(pair: { dark: CodeThemeOutput; light: CodeThemeOutput }): string {
  return JSON.stringify(pair, null, 2)
}
