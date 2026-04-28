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
  focusBorder: SemanticColor
  inputBackground: SemanticColor
  divider: SemanticColor
  outline: SemanticColor

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

  // Status
  errorForeground: SemanticColor
  warningForeground: SemanticColor
  infoForeground: SemanticColor
  successForeground: SemanticColor

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

export interface PersonalityContrastProfile {
  fgLightnessScale: number
  chromaScale: number
  /** Bg L shift in dark mode (negative = deeper, positive = lifted). */
  bgLightnessOffsetDark: number
  /** Bg L shift in light mode (negative = darker, positive = whiter). */
  bgLightnessOffsetLight: number
}

export interface PersonalityFontStyleProfile {
  comments?: string
  keywords?: string
  definitions?: string
  types?: string
  /** Per-scope overrides keyed by TextMate scope prefix. Empty string removes default. */
  scopeOverrides?: Record<string, string>
}

export interface PersonalityConfig {
  bgTint: PersonalityBgTint | null
  contrastProfile: PersonalityContrastProfile | null
  fontStyleProfile: PersonalityFontStyleProfile | null
  /** Human-readable label for the style lens (e.g. "Engineered", "Cinematic"). */
  lensName: string
  /** Palette's inherent character. */
  paletteCharacter: PaletteCharacter
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
