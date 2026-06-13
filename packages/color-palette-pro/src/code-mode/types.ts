import Color from 'colorjs.io'
import { PaletteKinds } from '../types'

// ===== SEMANTIC COLOR ROLES =====

export type SemanticColor = {
  hex: string
}

export interface SemanticColors {
  // Surface and structural
  editorBackground: SemanticColor
  editorForeground: SemanticColor
  sidebarBackground: SemanticColor
  panelBackground: SemanticColor
  overlayBackground: SemanticColor
  statusBarBackground: SemanticColor
  /** Optional top-border accent for the status bar (diamond lens only). */
  statusBarBorderTop?: SemanticColor
  focusBorder: SemanticColor
  inputBackground: SemanticColor
  /** Surface used for chat / agents input fields — sunken in dark, lifted in light. */
  inputSunken: SemanticColor
  divider: SemanticColor
  outline: SemanticColor
  outlineVariant: SemanticColor
  /** Solid neutral one step from editor, used for line/range/hover highlights. */
  neutralBand: SemanticColor
  /** Cursor color — character-driven (foreground for calm characters, accent for loud). */
  cursorColor: SemanticColor

  // Primary syntax roles (chromatic)
  definitionColor: SemanticColor
  keywordColor: SemanticColor
  typeColor: SemanticColor
  stringColor: SemanticColor
  numberColor: SemanticColor
  regexColor: SemanticColor
  accentColor: SemanticColor

  // Quiet roles (mostly neutral with palette tint)
  defaultForeground: SemanticColor
  variableColor: SemanticColor
  propertyColor: SemanticColor
  operatorColor: SemanticColor
  punctuationColor: SemanticColor
  commentColor: SemanticColor

  // Status (foregrounds + paired soft containers for backgrounds)
  errorForeground: SemanticColor
  errorContainer: SemanticColor
  onErrorContainer: SemanticColor
  warningForeground: SemanticColor
  warningContainer: SemanticColor
  onWarningContainer: SemanticColor
  infoForeground: SemanticColor
  infoContainer: SemanticColor
  onInfoContainer: SemanticColor
  successForeground: SemanticColor
  successContainer: SemanticColor
  onSuccessContainer: SemanticColor

  // Accent containers (soft backgrounds for badges, secondary buttons, regions)
  primaryContainer: SemanticColor
  onPrimaryContainer: SemanticColor
  secondaryColor: SemanticColor
  onSecondaryColor: SemanticColor
  secondaryContainer: SemanticColor
  onSecondaryContainer: SemanticColor

  // Terminal ANSI
  terminalAnsiBlack: SemanticColor
  terminalAnsiRed: SemanticColor
  terminalAnsiGreen: SemanticColor
  terminalAnsiYellow: SemanticColor
  terminalAnsiBlue: SemanticColor
  terminalAnsiMagenta: SemanticColor
  terminalAnsiCyan: SemanticColor
  terminalAnsiWhite: SemanticColor

  // Markdown (heading is the most prominent; lower levels ramp down)
  markdownHeadingColor: SemanticColor
  markdownLinkColor: SemanticColor
  markdownQuoteColor: SemanticColor

  // Bracket pair spread (6 hex strings, harmonic, alpha-baked)
  bracketPairColors: string[]
}

// ===== TEMPLATE CONFIGURATION =====

export interface SyntaxColors {
  // Chromatic — driven by palette swatches
  definitionColor: Color
  keywordColor: Color
  typeColor: Color
  stringColor: Color
  numberColor: Color
  regexColor: Color
  accentColor: Color

  // Quiet — derived from surface neutrals with palette tint
  variableColor: Color
  propertyColor: Color
  operatorColor: Color
  punctuationColor: Color
  commentColor: Color
}

/** Bundle of surface tones the templates use to derive quiet roles. */
export interface SurfaceBundle {
  surface: Color
  onSurface: Color
  onSurfaceVariant: Color
  container: Color
  containerSunken: Color
  containerOverlay: Color
  outline: Color
  outlineVariant: Color
}

export interface CodeThemeTemplate {
  /** Human-readable name for the palette type */
  displayName: string

  /** Derive the syntax token colors. Receives surfaces so quiet roles tint against real neutrals. */
  deriveColors(
    baseColor: Color,
    palette: BaseColorData[],
    isDarkMode: boolean,
    surfaces: SurfaceBundle,
  ): SyntaxColors

  /** Six bracket-pair colors as Color objects. base.ts applies alpha at render. */
  deriveBracketPairs(
    baseColor: Color,
    palette: BaseColorData[],
    isDarkMode: boolean,
  ): Color[]
}

export interface TokenRule {
  scope?: string[] | string
  settings: {
    foreground: string
    fontStyle?: string
  }
}

export interface CodeThemeOutput {
  $schema?: string
  name: string
  displayName: string
  description?: string
  author?: string
  type: 'dark' | 'light'
  semanticHighlighting: boolean
  colors: Record<string, string>
  tokenColors: TokenRule[]
  semanticTokenColors: Record<string, string | { foreground?: string; fontStyle?: string }>
}

// ===== PERSONALITY SYSTEM =====

/**
 * Each palette has an inherent emotional character that drives font-style and tone choices.
 * - serene:  balanced, calm (analogous, triadic)
 * - vivid:   high-contrast, dramatic (complementary, tetradic)
 * - crisp:   medium-energy, structured (split-complementary)
 * - mono:    near-single-hue, moody (tones, tints-and-shades)
 */
export type PaletteCharacter = 'serene' | 'vivid' | 'crisp' | 'mono'

export interface PersonalityBgTint {
  chromaBoost: number
}

/**
 * Target band for loud syntax roles: all loud tokens are remapped (rank-preserving)
 * into [lLo, lHi] lightness and [cLo, cHi] chroma — the "every great theme holds its
 * tokens in a narrow band" property measured from the exemplar themes.
 */
export interface TokenBand {
  lLo: number
  lHi: number
  cLo: number
  cHi: number
}

/** Quiet-role band: identifiers (variable/property) clamp here; cHi is their tint ceiling. */
export interface QuietBand {
  lLo: number
  lHi: number
  cHi: number
}

export interface ModeBands {
  loud: TokenBand
  quiet: QuietBand
}

/** Loud roles eligible to carry a character's chroma accent. */
export type SyntaxAccentRole =
  | 'definitionColor'
  | 'keywordColor'
  | 'typeColor'
  | 'stringColor'
  | 'numberColor'
  | 'accentColor'

export interface PersonalityFontStyleProfile {
  comments?: string
  keywords?: string
  definitions?: string
  types?: string
  /** Per-scope overrides keyed by TextMate scope prefix. Empty string removes default. */
  scopeOverrides?: Record<string, string>
}

/**
 * Surface profile — controls how chrome relates to the editor, how loud highlights
 * are, and where each character's signature moves land. Derived from (lens × character)
 * in personality.ts and consumed in index.ts + base.ts.
 */
export interface SurfaceProfile {
  /** Editor L override in dark mode. Modern themes anchor editor as the deepest point. */
  editorLDark: number
  /** Editor L in light mode — character driven (vivid → 1.0, serene/mono → 0.98). */
  editorLLight: number
  /** Peak alpha for the chromatic highlight ramp, per mode. */
  peakAlpha: { dark: number; light: number }
  /** Which surface plays "sidebar". Light mode often differs from dark. */
  sidebarSurface: { dark: 'container' | 'containerSunken'; light: 'container' | 'containerSunken' }
  /** Whether sidebar/chrome surfaces get a primary-hue tint. */
  chromeTint: boolean
  /**
   * Force fully neutral chrome + editor surfaces (chroma ≤ 0.003), the Dark Modern /
   * Vitesse / min-light school. Measured rule from the top-theme corpus: themes are
   * bimodal — chrome is either neutral, or tinted to *match the editor bg* (same hue,
   * chroma never exceeding the bg's own).
   */
  chromeNeutral: boolean
  /** How the status bar is styled. */
  statusBarStyle: 'match-sidebar' | 'tinted' | 'primary' | 'primary-deep'
  /** Cursor color source. */
  cursorSource: 'foreground' | 'accent'
  /** Inactive selection style. */
  inactiveSelectionStyle: 'chromatic' | 'complementary' | 'neutral'
  /** Amount of primary-hue tint applied to the neutral band (0 = pure neutral). */
  neutralBandTint: number
}

export interface PersonalityConfig {
  bgTint: PersonalityBgTint | null
  /** Per-mode token bands set by the style lens. */
  tokenBands: { dark: ModeBands; light: ModeBands }
  /** Editor bg L shift per mode (character × lens). */
  bgOffset: { dark: number; light: number }
  /** Which loud roles carry the chroma peak for this palette's character. */
  accentRoles: SyntaxAccentRole[]
  fontStyleProfile: PersonalityFontStyleProfile | null
  surfaceProfile: SurfaceProfile
  /** Human-readable label for the style lens (e.g. "Engineered", "Cinematic"). */
  lensName: string
  /** Palette's inherent character. */
  paletteCharacter: PaletteCharacter
}

// ===== FORMAT SELECTION =====

export type ThemeFormat = 'vscode' | 'zed' | 'iterm2' | 'ghostty'

// ===== FORMAT-AGNOSTIC THEME DATA =====

/**
 * Everything a format serializer needs — produced by buildThemeData() in index.ts
 * and consumed by serializeAsVSCode / serializeAsZed / serializeAsIterm2 / etc.
 */
export interface ThemeData {
  semanticColors: SemanticColors
  isDarkMode: boolean
  type: 'dark' | 'light'
  name: string
  displayName: string
  description: string
  author: string
  peakAlpha: number
  inactiveSelectionStyle: SurfaceProfile['inactiveSelectionStyle']
  fontStyleProfile: PersonalityFontStyleProfile | null
}

// ===== ZED OUTPUT =====

export interface ZedSyntaxToken {
  color?: string
  font_style?: 'italic' | 'normal' | 'oblique'
  font_weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
}

export interface ZedTheme {
  name: string
  appearance: 'dark' | 'light'
  style: Record<string, unknown>
}

export interface ZedThemeOutput {
  $schema: string
  name: string
  author: string
  themes: ZedTheme[]
}

// ===== COLOR DATA (from factory.ts) =====

export interface BaseColorData {
  code: `${string}-${number}` | string
  isBase: boolean
  base: string | Color
  color: Color
  colorSpace: string
  cssValue: string
  contrast: string
  string: string
  conversions: Record<string, any>
  fallback: string
}
