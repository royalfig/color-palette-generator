import type { ThemeData, ZedSyntaxToken, ZedTheme } from '../types'
import { brightAnsiHex } from '../utils'

/** Convert #RRGGBB or #RRGGBBAA to Zed's required #rrggbbaa format. */
function za(hex: string, alpha?: number): string {
  const base = hex.slice(0, 7)
  if (alpha !== undefined) {
    const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
      .toString(16)
      .padStart(2, '0')
    return (base + a).toLowerCase()
  }
  if (hex.length >= 9) return hex.slice(0, 9).toLowerCase()
  return (base + 'ff').toLowerCase()
}

export function serializeAsZed(data: ThemeData): ZedTheme {
  const { semanticColors: c, isDarkMode, type, name, fontStyleProfile, peakAlpha } = data

  const commentStyle = fontStyleProfile?.comments !== undefined ? fontStyleProfile.comments : 'italic'
  const keywordStyle = fontStyleProfile?.keywords !== undefined ? fontStyleProfile.keywords : 'italic'

  const fs = (style: string): Pick<ZedSyntaxToken, 'font_style'> =>
    style === 'italic' ? { font_style: 'italic' } : {}

  const bright = (hex: string, isBlack = false) => za(brightAnsiHex(hex, isDarkMode, isBlack))

  const syntax: Record<string, ZedSyntaxToken> = {
    keyword: { color: za(c.keywordColor.hex), ...fs(keywordStyle) },
    string: { color: za(c.stringColor.hex) },
    'string.escape': { color: za(c.regexColor.hex) },
    'string.regex': { color: za(c.regexColor.hex) },
    'string.special': { color: za(c.accentColor.hex) },
    'string.special.symbol': { color: za(c.accentColor.hex) },
    comment: { color: za(c.commentColor.hex), ...fs(commentStyle) },
    'comment.doc': { color: za(c.commentColor.hex), ...fs(commentStyle) },
    function: { color: za(c.definitionColor.hex) },
    constructor: { color: za(c.definitionColor.hex) },
    type: { color: za(c.typeColor.hex) },
    enum: { color: za(c.typeColor.hex) },
    variant: { color: za(c.typeColor.hex) },
    number: { color: za(c.numberColor.hex) },
    boolean: { color: za(c.accentColor.hex) },
    constant: { color: za(c.numberColor.hex) },
    variable: { color: za(c.variableColor.hex) },
    'variable.special': { color: za(c.accentColor.hex) },
    property: { color: za(c.propertyColor.hex) },
    attribute: { color: za(c.definitionColor.hex) },
    tag: { color: za(c.keywordColor.hex) },
    operator: { color: za(c.operatorColor.hex) },
    punctuation: { color: za(c.punctuationColor.hex) },
    'punctuation.bracket': { color: za(c.punctuationColor.hex) },
    'punctuation.delimiter': { color: za(c.punctuationColor.hex) },
    'punctuation.special': { color: za(c.accentColor.hex) },
    'punctuation.list_marker': { color: za(c.accentColor.hex) },
    label: { color: za(c.definitionColor.hex) },
    preproc: { color: za(c.keywordColor.hex) },
    embedded: { color: za(c.accentColor.hex) },
    link_text: { color: za(c.markdownLinkColor.hex) },
    link_uri: { color: za(c.markdownLinkColor.hex) },
    title: { color: za(c.markdownHeadingColor.hex), font_weight: 700 },
    emphasis: { color: za(c.keywordColor.hex), font_style: 'italic' },
    'emphasis.strong': { color: za(c.accentColor.hex), font_weight: 700 },
    'text.literal': { color: za(c.stringColor.hex) },
    primary: { color: za(c.defaultForeground.hex) },
    hint: { color: za(c.commentColor.hex) },
    predictive: { color: za(c.commentColor.hex), font_style: 'italic' },
  }

  const style: Record<string, unknown> = {
    // Surfaces
    background: za(c.panelBackground.hex),
    'elevated_surface.background': za(c.overlayBackground.hex),
    'surface.background': za(c.sidebarBackground.hex),
    'panel.background': za(c.panelBackground.hex),

    // Editor
    'editor.background': za(c.editorBackground.hex),
    'editor.gutter.background': za(c.editorBackground.hex),
    'editor.active_line.background': za(c.neutralBand.hex),
    'editor.highlighted_line.background': za(c.neutralBand.hex, 0.5),
    'editor.line_number': za(c.editorForeground.hex, isDarkMode ? 0.35 : 0.45),
    'editor.active_line_number': za(c.editorForeground.hex),
    'editor.invisible': za(c.outlineVariant.hex),
    'editor.wrap_guide': za(c.outlineVariant.hex),
    'editor.active_wrap_guide': za(c.outline.hex),
    'editor.selection.background': za(c.focusBorder.hex, peakAlpha),
    'editor.document_highlight.read_background': za(c.focusBorder.hex, peakAlpha * 0.35),
    'editor.document_highlight.write_background': za(c.focusBorder.hex, peakAlpha * 0.55),
    'search.match_background': za(c.focusBorder.hex, peakAlpha * 0.65),

    // Chrome
    'status_bar.background': za(c.statusBarBackground.hex),
    'title_bar.background': za(c.sidebarBackground.hex),
    'title_bar.inactive_background': za(c.sidebarBackground.hex),
    'toolbar.background': za(c.editorBackground.hex),
    'tab_bar.background': za(c.sidebarBackground.hex),
    'tab.inactive_background': za(c.sidebarBackground.hex),
    'tab.active_background': za(c.editorBackground.hex),

    // Borders
    border: za(c.outlineVariant.hex),
    'border.variant': za(c.divider.hex),
    'border.focused': za(c.focusBorder.hex),
    'border.selected': za(c.focusBorder.hex),
    'border.transparent': '#00000000',
    'border.disabled': za(c.outlineVariant.hex, 0.5),

    // Text
    text: za(c.editorForeground.hex),
    'text.muted': za(c.editorForeground.hex, 0.55),
    'text.placeholder': za(c.editorForeground.hex, 0.5),
    'text.disabled': za(c.editorForeground.hex, 0.4),
    'text.accent': za(c.accentColor.hex),
    icon: za(c.editorForeground.hex),
    'icon.muted': za(c.editorForeground.hex, 0.55),
    'icon.disabled': za(c.editorForeground.hex, 0.4),
    'icon.placeholder': za(c.editorForeground.hex, 0.5),
    'icon.accent': za(c.accentColor.hex),
    link_text_hover: za(c.infoForeground.hex),

    // Element interaction states
    'element.background': '#00000000',
    'element.hover': za(c.focusBorder.hex, isDarkMode ? 0.12 : 0.10),
    'element.active': za(c.focusBorder.hex, isDarkMode ? 0.20 : 0.15),
    'element.selected': za(c.focusBorder.hex, isDarkMode ? 0.25 : 0.20),
    'element.disabled': za(c.outlineVariant.hex, 0.5),
    'ghost_element.background': '#00000000',
    'ghost_element.hover': za(c.editorForeground.hex, isDarkMode ? 0.08 : 0.06),
    'ghost_element.active': za(c.editorForeground.hex, isDarkMode ? 0.12 : 0.09),
    'ghost_element.selected': za(c.focusBorder.hex, isDarkMode ? 0.15 : 0.12),
    'ghost_element.disabled': za(c.editorForeground.hex, 0.35),
    'drop_target.background': za(c.focusBorder.hex, isDarkMode ? 0.15 : 0.12),

    // Scrollbar
    'scrollbar.thumb.background': za(c.editorForeground.hex, isDarkMode ? 0.15 : 0.12),
    'scrollbar.thumb.hover_background': za(c.editorForeground.hex, isDarkMode ? 0.25 : 0.20),
    'scrollbar.thumb.border': za(c.outlineVariant.hex),
    'scrollbar.track.background': '#00000000',
    'scrollbar.track.border': za(c.outlineVariant.hex),

    // Diagnostic / status
    error: za(c.errorForeground.hex),
    'error.background': za(c.errorContainer.hex),
    'error.border': za(c.errorForeground.hex, 0.5),
    warning: za(c.warningForeground.hex),
    'warning.background': za(c.warningContainer.hex),
    'warning.border': za(c.warningForeground.hex, 0.5),
    success: za(c.successForeground.hex),
    'success.background': za(c.successContainer.hex),
    'success.border': za(c.successForeground.hex, 0.5),
    info: za(c.infoForeground.hex),
    'info.background': za(c.infoContainer.hex),
    'info.border': za(c.infoForeground.hex, 0.5),
    hint: za(c.commentColor.hex),
    'hint.background': za(c.panelBackground.hex),
    'hint.border': za(c.outlineVariant.hex),
    predictive: za(c.commentColor.hex),
    'predictive.background': '#00000000',
    'predictive.border': '#00000000',

    // Git file status
    created: za(c.successForeground.hex),
    'created.background': za(c.successContainer.hex),
    'created.border': za(c.successForeground.hex, 0.5),
    deleted: za(c.errorForeground.hex),
    'deleted.background': za(c.errorContainer.hex),
    'deleted.border': za(c.errorForeground.hex, 0.5),
    modified: za(c.infoForeground.hex),
    'modified.background': za(c.infoContainer.hex),
    'modified.border': za(c.infoForeground.hex, 0.5),
    conflict: za(c.warningForeground.hex),
    'conflict.background': za(c.warningContainer.hex),
    'conflict.border': za(c.warningForeground.hex, 0.5),
    hidden: za(c.commentColor.hex),
    'hidden.background': '#00000000',
    'hidden.border': '#00000000',
    ignored: za(c.commentColor.hex),
    'ignored.background': '#00000000',
    'ignored.border': '#00000000',
    renamed: za(c.accentColor.hex),
    'renamed.background': '#00000000',
    'renamed.border': '#00000000',

    // Players (multi-cursor / collab)
    players: [
      {
        cursor: za(c.cursorColor.hex),
        background: za(c.accentColor.hex),
        selection: za(c.focusBorder.hex, peakAlpha),
      },
    ],

    // Terminal
    'terminal.background': za(c.editorBackground.hex),
    'terminal.foreground': za(c.editorForeground.hex),
    'terminal.bright_foreground': za(c.editorForeground.hex),
    'terminal.dim_foreground': za(c.editorForeground.hex, 0.6),
    'terminal.ansi.black': za(c.terminalAnsiBlack.hex),
    'terminal.ansi.red': za(c.terminalAnsiRed.hex),
    'terminal.ansi.green': za(c.terminalAnsiGreen.hex),
    'terminal.ansi.yellow': za(c.terminalAnsiYellow.hex),
    'terminal.ansi.blue': za(c.terminalAnsiBlue.hex),
    'terminal.ansi.magenta': za(c.terminalAnsiMagenta.hex),
    'terminal.ansi.cyan': za(c.terminalAnsiCyan.hex),
    'terminal.ansi.white': za(c.terminalAnsiWhite.hex),
    'terminal.ansi.bright_black': bright(c.terminalAnsiBlack.hex, true),
    'terminal.ansi.bright_red': bright(c.terminalAnsiRed.hex),
    'terminal.ansi.bright_green': bright(c.terminalAnsiGreen.hex),
    'terminal.ansi.bright_yellow': bright(c.terminalAnsiYellow.hex),
    'terminal.ansi.bright_blue': bright(c.terminalAnsiBlue.hex),
    'terminal.ansi.bright_magenta': bright(c.terminalAnsiMagenta.hex),
    'terminal.ansi.bright_cyan': bright(c.terminalAnsiCyan.hex),
    'terminal.ansi.bright_white': bright(c.terminalAnsiWhite.hex),

    syntax,
  }

  return { name, appearance: type, style }
}
