import { deriveUiColors, generateBaseTokenRules, generateSemanticTokenRules } from '../templates/base'
import type { CodeThemeOutput, ThemeData } from '../types'

export function buildVscodeTheme(data: ThemeData): CodeThemeOutput {
  const {
    semanticColors,
    isDarkMode,
    type,
    name,
    displayName,
    description,
    author,
    peakAlpha,
    inactiveSelectionStyle,
    fontStyleProfile,
  } = data

  const uiColors = deriveUiColors(semanticColors, isDarkMode, {
    peakAlpha,
    inactiveSelectionStyle,
  })
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

export function serializeAsVscode(data: ThemeData): string {
  return JSON.stringify(buildVscodeTheme(data), null, 2)
}
