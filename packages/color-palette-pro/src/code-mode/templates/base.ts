import Color from 'colorjs.io'
import type { PersonalityFontStyleProfile, SemanticColors, TokenRule } from '../types'
import { toHex, desaturate, boostChroma, ensureContrast, getAccessibleVariant, withAlpha } from '../utils'

/**
 * Common scope sets used across all templates.
 */
export const scopeSets = {
  default: ['text'],

  keywords: [
    'keyword',
    'keyword.control',
    'storage.modifier',
    'storage.type',
    'keyword.control.new',
    'storage.control.clojure',
    'entity.name.function.clojure',
    'support.function.node',
    'punctuation.separator.key-value',
    'punctuation.definition.template-expression',
  ],

  strings: [
    'string',
    'markup.fenced_code',
    'markup.inline',
    'string.quoted',
    'string.interpolated',
    'string.template',
    'string.unquoted.plain.out.yaml',
    'keyword.other.template',
  ],

  comments: [
    'comment',
    'string.quoted.docstring.multi',
    'punctuation.definition.comment',
    'unused.comment',
    'wildcard.comment',
  ],

  // "this", "self", "super", booleans, null — the language-keyword constants that deserve a pop.
  accents: [
    'variable.language',
    'variable.language.this',
    'variable.language.self',
    'variable.language.super',
    'constant.language',
    'constant.language.boolean',
    'constant.language.null',
    'constant.language.undefined',
  ],

  constants: [
    'variable.other.constant',
    'meta.property-name',
    'support',
    'string.other.link.title.markdown',
    'constant',
  ],

  numbers: [
    'constant.numeric',
    'constant.other.placeholder',
    'constant.character.format.placeholder',
    'meta.property-value',
    'keyword.other.unit',
    'constant.other.date',
    'constant.other.timestamp',
  ],

  functions: [
    'entity.name.function',
    'meta.function-call',
    'meta.instance.constructor',
    'constant.keyword.clojure',
    'support.function',
    'support.function.any-method.lua',
    'keyword.operator.function.infix',
  ],

  types: [
    'entity.name.type',
    'entity.name.class',
    'entity.name.type.class',
    'entity.other.inherited-class',
    'support.type',
    'support.class',
  ],

  variables: [
    'variable',
    'variable.parameter',
    'variable.other.readwrite',
    'variable.other.object',
    'meta.parameter',
  ],

  properties: [
    'variable.other.property',
    'variable.other.object.property',
    'support.type.property-name',
    'meta.object-literal.key',
  ],

  // Operators and structural glue that should pop with a low-chroma cyan/teal feel.
  operators: [
    'keyword.operator',
    'keyword.operator.arithmetic',
    'keyword.operator.logical',
    'keyword.operator.comparison',
    'keyword.operator.assignment',
    'keyword.operator.relational',
    'keyword.operator.bitwise',
    'storage.type.function.arrow',
  ],

  // Regex internals + character escapes.
  regex: [
    'string.regexp',
    'constant.character.escape',
    'constant.other.character-class',
    'keyword.operator.regexp',
    'keyword.control.anchor.regexp',
    'punctuation.definition.group.regexp',
  ],

  tags: [
    'entity.name.tag',
    'punctuation.definition.tag.cs',
  ],

  attributes: [
    'entity.other.attribute-name',
    'meta.selector',
    'entity.other.attribute-name.parent-selector',
  ],

  punctuation: [
    'punctuation.definition.arguments',
    'punctuation.definition.dict',
    'punctuation.separator',
    'meta.function-call.arguments',
    'punctuation.colon.graphql',
    'punctuation.definition.block.scalar.folded.yaml',
    'punctuation.definition.block.scalar.literal.yaml',
    'punctuation.definition.block.sequence.item.yaml',
    'punctuation.definition.entity.other.inherited-class',
    'punctuation.function.swift',
    'punctuation.separator.dictionary.key-value',
    'punctuation.separator.hash',
    'punctuation.separator.inheritance',
    'punctuation.separator.key-value',
    'punctuation.separator.namespace',
    'punctuation.separator.pointer-access',
    'punctuation.separator.slice',
    'string.unquoted.heredoc punctuation.definition.string',
    'support.other.chomping-indicator.yaml',
    'punctuation.separator.annotation',
    'punctuation.terminator',
    'meta.brace',
  ],

  // Markdown
  markdownH1: ['markup.heading.1.markdown', 'heading.1.markdown', 'markup.heading.1'],
  markdownH2: ['markup.heading.2.markdown', 'heading.2.markdown', 'markup.heading.2'],
  markdownH3: ['markup.heading.3.markdown', 'heading.3.markdown', 'markup.heading.3'],
  markdownH4: ['markup.heading.4.markdown', 'heading.4.markdown', 'markup.heading.4'],
  markdownH5: ['markup.heading.5.markdown', 'heading.5.markdown', 'markup.heading.5'],
  markdownH6: ['markup.heading.6.markdown', 'heading.6.markdown', 'markup.heading.6'],
  markdownBold: ['markup.bold', 'markup.bold.markdown', 'strong'],
  markdownItalic: ['markup.italic', 'markup.italic.markdown', 'emphasis'],
  markdownLink: [
    'meta.link.inline.markdown',
    'markup.underline.link',
    'markup.underline.link.image',
    'string.other.link.title.markdown',
  ],
  markdownCode: [
    'markup.fenced_code',
    'markup.raw.inner.restructuredtext',
    'markup.raw.restructuredtext',
    'fenced_code.block.language',
    'markup.fenced_code.block.markdown punctuation.definition.markdown',
  ],
  markdownQuote: [
    'markup.quote',
    'entity.name.directive.restructuredtext',
    'markup.quote.markdown meta.paragraph.markdown punctuation.definition.string.begin',
    'markup.quote.markdown meta.paragraph.markdown punctuation.definition.string.end',
  ],
  markdownListMarker: [
    'punctuation.definition.list.begin.markdown',
    'beginning.punctuation.definition.list.markdown',
  ],

  diffInserted: ['markup.inserted'],
  diffRemoved: ['markup.deleted'],
  diffChanged: ['markup.changed'],
  diffHeader: ['meta.diff', 'meta.diff.header'],
}

/**
 * Step a color's L by delta within [0, 1].
 */
function stepL(hex: string, delta: number): string {
  const c = new Color(hex)
  c.oklch.l = Math.max(0.05, Math.min(0.98, (c.oklch.l ?? 0.5) + delta))
  return toHex(c)
}

/**
 * Optional knobs surfaced from the caller (index.ts), e.g. selection-overlay
 * alpha computed by the legibility check.
 */
export interface UiColorOptions {
  selectionAlpha?: number
}

/**
 * Derive UI colors from semantic palette colors.
 */
export function deriveUiColors(
  semantic: SemanticColors,
  isDarkMode: boolean,
  options: UiColorOptions = {},
): Record<string, string> {
  const {
    editorBackground, editorForeground, sidebarBackground, panelBackground, overlayBackground,
    statusBarBackground, outline, divider, bracketPairColors,
  } = semantic

  // Selection alpha — caller (index.ts) may have lifted it to keep the overlay
  // legible against syntax foreground.
  const selectionAlpha = options.selectionAlpha ?? (isDarkMode ? 0.25 : 0.20)
  const inactiveSelectionAlpha = selectionAlpha * 0.75

  // Bracket pairs come from the template as a 6-color harmonic spread.
  // Apply alpha so they don't collide with text underneath.
  const bracketAlpha = isDarkMode ? 0.55 : 0.45
  const bp = (i: number): string => {
    const hex = bracketPairColors[i] ?? bracketPairColors[0] ?? editorForeground.hex
    return toHex(withAlpha(hex, bracketAlpha))
  }

  const brightAnsi = (hex: string, isBlack = false): string => {
    const c = new Color(hex)
    c.oklch.l = Math.min(0.95, (c.oklch.l ?? 0.5) + (isDarkMode ? (isBlack ? 0.20 : 0.10) : -0.05))
    return toHex(c)
  }

  return {
    // Editor
    'editor.background': editorBackground.hex,
    'editor.foreground': editorForeground.hex,
    'editor.lineHighlightBackground': toHex(withAlpha(editorForeground.hex, isDarkMode ? 0.05 : 0.03)),
    'editor.lineHighlightBorder': toHex(withAlpha(editorForeground.hex, isDarkMode ? 0.1 : 0.05)),
    'editor.selectionBackground': toHex(withAlpha(semantic.focusBorder.hex, selectionAlpha)),
    'editor.selectionHighlightBackground': toHex(withAlpha(semantic.focusBorder.hex, selectionAlpha * 0.6)),
    'editor.findMatchBackground': toHex(withAlpha(semantic.accentColor.hex, 0.5)),
    'editor.findMatchHighlightBackground': toHex(withAlpha(semantic.accentColor.hex, 0.3)),
    'editor.inactiveSelectionBackground': toHex(withAlpha(semantic.focusBorder.hex, inactiveSelectionAlpha)),
    'editor.rangeHighlightBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.10)),
    'editor.hoverHighlightBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.10)),
    'editor.wordHighlightBackground': toHex(withAlpha(semantic.infoForeground.hex, 0.30)),
    'editor.wordHighlightStrongBackground': toHex(withAlpha(semantic.definitionColor.hex, 0.40)),

    // Bracket pair colorization (harmonic spread, alpha-baked)
    'editorBracketHighlight.foreground1': bp(0),
    'editorBracketHighlight.foreground2': bp(1),
    'editorBracketHighlight.foreground3': bp(2),
    'editorBracketHighlight.foreground4': bp(3),
    'editorBracketHighlight.foreground5': bp(4),
    'editorBracketHighlight.foreground6': bp(5),
    'editorBracketHighlight.unexpectedBracket.foreground': semantic.errorForeground.hex,
    'editorBracketPairGuide.activeBackground1': bp(0),
    'editorBracketPairGuide.activeBackground2': bp(1),
    'editorBracketPairGuide.activeBackground3': bp(2),

    'editorCodeLens.foreground': toHex(desaturate(new Color(editorForeground.hex), 0.7)),
    'editorCursor.foreground': semantic.accentColor.hex,
    'editorInlayHint.foreground': toHex(withAlpha(semantic.propertyColor.hex, 0.7)),
    'editorInlayHint.background': toHex(withAlpha(panelBackground.hex, 0.5)),
    'editorInlayHint.typeForeground': toHex(withAlpha(semantic.typeColor.hex, 0.75)),
    'editorInlayHint.parameterForeground': toHex(withAlpha(semantic.variableColor.hex, 0.7)),
    'editorGroup.border': divider.hex,
    'editorGroup.dropBackground': toHex(withAlpha(sidebarBackground.hex, 0.7)),
    'editorGroupHeader.tabsBackground': sidebarBackground.hex,
    'editorGroupHeader.tabsBorder': sidebarBackground.hex,
    'editorGutter.addedBackground': toHex(withAlpha(semantic.successForeground.hex, 0.7)),
    'editorGutter.deletedBackground': toHex(withAlpha(semantic.errorForeground.hex, 0.7)),
    'editorGutter.modifiedBackground': toHex(withAlpha(semantic.infoForeground.hex, 0.7)),
    'editorHoverWidget.background': overlayBackground.hex,
    'editorHoverWidget.border': outline.hex,
    'editorIndentGuide.activeBackground': toHex(withAlpha(editorForeground.hex, 0.25)),
    'editorIndentGuide.background': toHex(withAlpha(editorForeground.hex, 0.08)),
    'editorLineNumber.foreground': toHex(withAlpha(editorForeground.hex, isDarkMode ? 0.35 : 0.45)),
    'editorLineNumber.activeForeground': editorForeground.hex,
    'editorLink.activeForeground': semantic.infoForeground.hex,
    'editorMarkerNavigation.background': overlayBackground.hex,
    'editorOverviewRuler.addedForeground': toHex(withAlpha(semantic.successForeground.hex, 0.5)),
    'editorOverviewRuler.border': sidebarBackground.hex,
    'editorOverviewRuler.deletedForeground': toHex(withAlpha(semantic.errorForeground.hex, 0.5)),
    'editorOverviewRuler.errorForeground': toHex(withAlpha(semantic.errorForeground.hex, 0.5)),
    'editorOverviewRuler.infoForeground': toHex(withAlpha(semantic.infoForeground.hex, 0.5)),
    'editorOverviewRuler.modifiedForeground': toHex(withAlpha(semantic.infoForeground.hex, 0.5)),
    'editorOverviewRuler.warningForeground': toHex(withAlpha(semantic.warningForeground.hex, 0.5)),
    'editorOverviewRuler.wordHighlightForeground': semantic.infoForeground.hex,
    'editorRuler.foreground': toHex(withAlpha(editorForeground.hex, 0.1)),
    'editorSuggestWidget.background': overlayBackground.hex,
    'editorSuggestWidget.foreground': editorForeground.hex,
    'editorSuggestWidget.border': outline.hex,
    'editorSuggestWidget.selectedBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.3)),
    'editorWhitespace.foreground': toHex(withAlpha(editorForeground.hex, 0.08)),
    'editorWidget.background': overlayBackground.hex,
    'editorWidget.border': outline.hex,

    // Error/warning
    'editorError.foreground': semantic.errorForeground.hex,
    'editorWarning.foreground': semantic.warningForeground.hex,
    'editorInfo.foreground': semantic.infoForeground.hex,
    'errorForeground': semantic.errorForeground.hex,

    // Focus and selection
    'focusBorder': semantic.focusBorder.hex,
    'foreground': editorForeground.hex,
    'selection.background': toHex(withAlpha(semantic.focusBorder.hex, 0.3)),

    // Side bar
    'sideBar.background': sidebarBackground.hex,
    'sideBar.foreground': editorForeground.hex,
    'sideBarSectionHeader.background': sidebarBackground.hex,
    'sideBarSectionHeader.border': divider.hex,
    'sideBarSectionHeader.foreground': editorForeground.hex,
    'sideBarTitle.foreground': editorForeground.hex,

    // Status bar
    'statusBar.background': statusBarBackground.hex,
    'statusBar.foreground': ensureContrast(
      new Color(editorForeground.hex),
      new Color(statusBarBackground.hex),
      4.5,
    ),
    'statusBar.border': divider.hex,
    'statusBar.noFolderBackground': statusBarBackground.hex,
    'statusBar.noFolderForeground': editorForeground.hex,
    'statusBar.debuggingBackground': semantic.warningForeground.hex,
    'statusBar.debuggingForeground': sidebarBackground.hex,
    'statusBarItem.prominentBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.4)),
    'statusBarItem.prominentHoverBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.6)),
    'statusBarItem.remoteBackground': semantic.accentColor.hex,
    'statusBarItem.remoteForeground': getAccessibleVariant(new Color(editorForeground.hex), new Color(semantic.accentColor.hex), 4.5),

    // Tabs
    'tab.activeBackground': editorBackground.hex,
    'tab.activeBorderTop': semantic.accentColor.hex,
    'tab.activeBorder': semantic.focusBorder.hex,
    'tab.activeForeground': editorForeground.hex,
    'tab.border': sidebarBackground.hex,
    'tab.inactiveBackground': sidebarBackground.hex,
    'tab.inactiveForeground': toHex(withAlpha(editorForeground.hex, 0.55)),
    'tab.hoverBackground': panelBackground.hex,
    'tab.unfocusedActiveBorderTop': toHex(withAlpha(semantic.accentColor.hex, 0.5)),

    // Title bar
    'titleBar.activeBackground': sidebarBackground.hex,
    'titleBar.activeForeground': editorForeground.hex,
    'titleBar.inactiveBackground': statusBarBackground.hex,
    'titleBar.inactiveForeground': toHex(withAlpha(editorForeground.hex, 0.55)),
    'titleBar.border': divider.hex,

    // Input
    'input.background': panelBackground.hex,
    'input.foreground': editorForeground.hex,
    'input.border': outline.hex,
    'input.placeholderForeground': toHex(withAlpha(editorForeground.hex, 0.5)),
    'inputOption.activeBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.2)),
    'inputOption.activeBorder': semantic.focusBorder.hex,
    'inputOption.activeForeground': editorForeground.hex,

    // Dropdown
    'dropdown.background': overlayBackground.hex,
    'dropdown.foreground': editorForeground.hex,
    'dropdown.border': outline.hex,

    // Button
    'button.background': semantic.focusBorder.hex,
    'button.foreground': getAccessibleVariant(new Color(editorForeground.hex), new Color(semantic.focusBorder.hex), 4.5),
    'button.secondaryBackground': toHex(withAlpha(editorForeground.hex, 0.1)),
    'button.secondaryForeground': editorForeground.hex,
    'button.hoverBackground': toHex(boostChroma(new Color(semantic.focusBorder.hex), 1.1)),

    // Lists
    'list.activeSelectionBackground': toHex(withAlpha(semantic.focusBorder.hex, isDarkMode ? 0.3 : 0.2)),
    'list.activeSelectionForeground': editorForeground.hex,
    'list.focusBackground': toHex(withAlpha(semantic.focusBorder.hex, isDarkMode ? 0.25 : 0.15)),
    'list.focusForeground': editorForeground.hex,
    'list.highlightForeground': semantic.infoForeground.hex,
    'list.hoverBackground': toHex(withAlpha(semantic.focusBorder.hex, isDarkMode ? 0.15 : 0.1)),
    'list.inactiveSelectionBackground': toHex(withAlpha(semantic.focusBorder.hex, isDarkMode ? 0.15 : 0.1)),
    'list.inactiveSelectionForeground': editorForeground.hex,
    'list.errorForeground': semantic.errorForeground.hex,
    'list.warningForeground': semantic.warningForeground.hex,

    // Panel
    'panel.background': panelBackground.hex,
    'panel.border': divider.hex,
    'panelTitle.activeBorder': semantic.accentColor.hex,
    'panelTitle.activeForeground': editorForeground.hex,
    'panelTitle.inactiveForeground': toHex(withAlpha(editorForeground.hex, 0.55)),
    'panelSection.border': divider.hex,
    'panelSectionHeader.background': sidebarBackground.hex,
    'panelSectionHeader.foreground': editorForeground.hex,

    // Peek view
    'peekView.border': semantic.focusBorder.hex,
    'peekViewEditor.background': overlayBackground.hex,
    'peekViewEditor.matchHighlightBackground': toHex(withAlpha(semantic.accentColor.hex, 0.4)),
    'peekViewResult.background': panelBackground.hex,
    'peekViewResult.matchHighlightBackground': toHex(withAlpha(semantic.accentColor.hex, 0.4)),
    'peekViewResult.selectionBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.4)),
    'peekViewResult.selectionForeground': editorForeground.hex,
    'peekViewTitle.background': sidebarBackground.hex,
    'peekViewTitleDescription.foreground': toHex(withAlpha(editorForeground.hex, 0.6)),
    'peekViewTitleLabel.foreground': editorForeground.hex,

    // Breadcrumb
    'breadcrumb.background': editorBackground.hex,
    'breadcrumb.foreground': toHex(withAlpha(editorForeground.hex, 0.55)),
    'breadcrumb.focusForeground': editorForeground.hex,
    'breadcrumb.activeSelectionForeground': editorForeground.hex,
    'breadcrumbPicker.background': overlayBackground.hex,

    // Picker
    'pickerGroup.border': divider.hex,
    'pickerGroup.foreground': semantic.infoForeground.hex,

    // Progress bar
    'progressBar.background': semantic.accentColor.hex,

    // Git decoration
    'gitDecoration.ignoredResourceForeground': toHex(withAlpha(editorForeground.hex, 0.4)),
    'gitDecoration.modifiedResourceForeground': semantic.infoForeground.hex,
    'gitDecoration.deletedResourceForeground': semantic.errorForeground.hex,
    'gitDecoration.untrackedResourceForeground': semantic.successForeground.hex,
    'gitDecoration.conflictingResourceForeground': semantic.warningForeground.hex,
    'gitDecoration.submoduleResourceForeground': toHex(withAlpha(editorForeground.hex, 0.6)),
    'gitDecoration.renamedResourceForeground': semantic.accentColor.hex,
    'gitDecoration.stageDeletedResourceForeground': toHex(withAlpha(semantic.errorForeground.hex, 0.85)),
    'gitDecoration.stageModifiedResourceForeground': toHex(withAlpha(semantic.infoForeground.hex, 0.85)),

    // Merge
    'merge.currentHeaderBackground': toHex(withAlpha(semantic.successForeground.hex, 0.35)),
    'merge.currentContentBackground': toHex(withAlpha(semantic.successForeground.hex, 0.15)),
    'merge.incomingHeaderBackground': toHex(withAlpha(semantic.infoForeground.hex, 0.35)),
    'merge.incomingContentBackground': toHex(withAlpha(semantic.infoForeground.hex, 0.15)),
    'merge.commonHeaderBackground': toHex(withAlpha(editorForeground.hex, 0.15)),

    // Debug
    'debugToolBar.background': overlayBackground.hex,
    'debugToolBar.border': outline.hex,
    'debugConsole.errorForeground': semantic.errorForeground.hex,
    'debugConsole.warningForeground': semantic.warningForeground.hex,
    'debugConsole.infoForeground': semantic.infoForeground.hex,
    'debugConsole.sourceForeground': semantic.accentColor.hex,
    'debugTokenExpression.name': semantic.variableColor.hex,
    'debugTokenExpression.value': semantic.numberColor.hex,
    'debugTokenExpression.string': semantic.stringColor.hex,
    'debugTokenExpression.boolean': semantic.accentColor.hex,
    'debugTokenExpression.number': semantic.numberColor.hex,
    'debugTokenExpression.error': semantic.errorForeground.hex,

    // Extension button
    'extensionButton.prominentBackground': semantic.successForeground.hex,
    'extensionButton.prominentForeground': getAccessibleVariant(new Color(editorForeground.hex), new Color(semantic.successForeground.hex), 4.5),
    'extensionButton.prominentHoverBackground': toHex(boostChroma(new Color(semantic.successForeground.hex), 1.1)),

    // Inline chat / notebook
    'inlineChat.regionHighlight': toHex(withAlpha(semantic.focusBorder.hex, 0.08)),
    'notebook.focusedCellBorder': semantic.focusBorder.hex,
    'notebook.cellBorderColor': divider.hex,
    'notebook.cellEditorBackground': editorBackground.hex,
    'notebook.cellInsertionIndicator': semantic.accentColor.hex,
    'notebookStatusErrorIcon.foreground': semantic.errorForeground.hex,
    'notebookStatusRunningIcon.foreground': semantic.accentColor.hex,
    'notebookStatusSuccessIcon.foreground': semantic.successForeground.hex,

    // Notification
    'notificationCenter.border': outline.hex,
    'notificationCenterHeader.background': sidebarBackground.hex,
    'notificationToast.border': outline.hex,
    'notifications.background': overlayBackground.hex,
    'notifications.foreground': editorForeground.hex,
    'notifications.border': outline.hex,
    'notificationLink.foreground': semantic.infoForeground.hex,

    // Scrollbar
    'scrollbar.shadow': editorBackground.hex,
    'scrollbarSlider.background': toHex(withAlpha(editorForeground.hex, isDarkMode ? 0.15 : 0.12)),
    'scrollbarSlider.hoverBackground': toHex(withAlpha(editorForeground.hex, isDarkMode ? 0.25 : 0.20)),
    'scrollbarSlider.activeBackground': toHex(withAlpha(semantic.focusBorder.hex, isDarkMode ? 0.50 : 0.40)),

    // Settings
    'settings.modifiedItemIndicator': semantic.warningForeground.hex,
    'settings.dropdownBackground': overlayBackground.hex,
    'settings.dropdownBorder': outline.hex,
    'settings.checkboxBackground': overlayBackground.hex,
    'settings.checkboxBorder': outline.hex,

    // Diff editor
    'diffEditor.insertedTextBackground': toHex(withAlpha(semantic.successForeground.hex, 0.15)),
    'diffEditor.removedTextBackground': toHex(withAlpha(semantic.errorForeground.hex, 0.15)),
    'diffEditor.insertedLineBackground': toHex(withAlpha(semantic.successForeground.hex, 0.08)),
    'diffEditor.removedLineBackground': toHex(withAlpha(semantic.errorForeground.hex, 0.08)),
    'diffEditor.diagonalFill': toHex(withAlpha(editorForeground.hex, 0.08)),
    'diffEditorOverview.insertedForeground': toHex(withAlpha(semantic.successForeground.hex, 0.5)),
    'diffEditorOverview.removedForeground': toHex(withAlpha(semantic.errorForeground.hex, 0.5)),

    // Walkthrough
    'walkThrough.embeddedEditorBackground': sidebarBackground.hex,

    // Input validation
    'inputValidation.errorBackground': toHex(withAlpha(semantic.errorForeground.hex, 0.15)),
    'inputValidation.errorBorder': semantic.errorForeground.hex,
    'inputValidation.infoBackground': toHex(withAlpha(semantic.infoForeground.hex, 0.15)),
    'inputValidation.infoBorder': semantic.infoForeground.hex,
    'inputValidation.warningBackground': toHex(withAlpha(semantic.warningForeground.hex, 0.15)),
    'inputValidation.warningBorder': semantic.warningForeground.hex,

    // Activity bar
    'activityBar.background': sidebarBackground.hex,
    'activityBar.foreground': editorForeground.hex,
    'activityBar.inactiveForeground': toHex(withAlpha(editorForeground.hex, 0.4)),
    'activityBar.border': divider.hex,
    'activityBar.activeBorder': semantic.accentColor.hex,
    'activityBar.activeBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.15)),
    'activityBarBadge.background': semantic.accentColor.hex,
    'activityBarBadge.foreground': getAccessibleVariant(new Color(editorForeground.hex), new Color(semantic.accentColor.hex), 4.5),
    'activityBarTop.foreground': editorForeground.hex,
    'activityBarTop.inactiveForeground': toHex(withAlpha(editorForeground.hex, 0.4)),
    'activityBarTop.activeBorder': semantic.accentColor.hex,
    'activityBarTop.dropBorder': semantic.focusBorder.hex,

    // Badge
    'badge.background': semantic.accentColor.hex,
    'badge.foreground': getAccessibleVariant(new Color(editorForeground.hex), new Color(semantic.accentColor.hex), 4.5),

    // Quick input / command palette
    'quickInput.background': overlayBackground.hex,
    'quickInput.foreground': editorForeground.hex,
    'quickInputList.focusBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.30)),
    'quickInputList.focusForeground': editorForeground.hex,
    'quickInputList.focusIconForeground': semantic.accentColor.hex,
    'quickInputTitle.background': sidebarBackground.hex,

    // Terminal UI
    'terminal.background': editorBackground.hex,
    'terminal.foreground': editorForeground.hex,
    'terminal.selectionBackground': toHex(withAlpha(semantic.focusBorder.hex, 0.30)),
    'terminal.border': divider.hex,
    'terminalCursor.foreground': semantic.accentColor.hex,
    'terminalCursor.background': editorBackground.hex,

    // Terminal ANSI colors (16 standard)
    'terminal.ansiBlack': semantic.terminalAnsiBlack.hex,
    'terminal.ansiRed': semantic.terminalAnsiRed.hex,
    'terminal.ansiGreen': semantic.terminalAnsiGreen.hex,
    'terminal.ansiYellow': semantic.terminalAnsiYellow.hex,
    'terminal.ansiBlue': semantic.terminalAnsiBlue.hex,
    'terminal.ansiMagenta': semantic.terminalAnsiMagenta.hex,
    'terminal.ansiCyan': semantic.terminalAnsiCyan.hex,
    'terminal.ansiWhite': semantic.terminalAnsiWhite.hex,

    'terminal.ansiBrightBlack': brightAnsi(semantic.terminalAnsiBlack.hex, true),
    'terminal.ansiBrightRed': brightAnsi(semantic.terminalAnsiRed.hex),
    'terminal.ansiBrightGreen': brightAnsi(semantic.terminalAnsiGreen.hex),
    'terminal.ansiBrightYellow': brightAnsi(semantic.terminalAnsiYellow.hex),
    'terminal.ansiBrightBlue': brightAnsi(semantic.terminalAnsiBlue.hex),
    'terminal.ansiBrightMagenta': brightAnsi(semantic.terminalAnsiMagenta.hex),
    'terminal.ansiBrightCyan': brightAnsi(semantic.terminalAnsiCyan.hex),
    'terminal.ansiBrightWhite': editorForeground.hex,
  }
}

/**
 * Generate token color rules for TextMate grammar.
 */
export function generateBaseTokenRules(
  semantic: SemanticColors,
  fontStyleProfile?: PersonalityFontStyleProfile,
): TokenRule[] {
  const commentStyle = fontStyleProfile?.comments !== undefined ? fontStyleProfile.comments : 'italic'
  const keywordStyle = fontStyleProfile?.keywords !== undefined ? fontStyleProfile.keywords : 'italic'
  const definitionStyle = fontStyleProfile?.definitions ?? ''
  const typeStyle = fontStyleProfile?.types ?? ''

  const fs = (style: string): { fontStyle?: string } => style ? { fontStyle: style } : {}

  // Markdown heading depth ramp: H1 most prominent, H6 quiet. Step L toward fg over 6 levels.
  const h = semantic.markdownHeadingColor.hex
  const headingRamp: string[] = [
    h,
    stepL(h, -0.02),
    stepL(h, -0.04),
    stepL(h, -0.06),
    stepL(h, -0.08),
    stepL(h, -0.10),
  ]

  return [
    // Default text color (fallback)
    { settings: { foreground: semantic.defaultForeground.hex } },

    // Comments
    { scope: scopeSets.comments, settings: { foreground: semantic.commentColor.hex, ...fs(commentStyle) } },
    { scope: ['string.quoted.docstring.multi', 'string.quoted.docstring.multi.python punctuation.definition.string.begin', 'string.quoted.docstring.multi.python punctuation.definition.string.end'], settings: { foreground: semantic.commentColor.hex, ...fs(commentStyle) } },
    { scope: ['comment keyword.codetag.notation', 'comment.block.documentation keyword', 'comment.block.documentation storage.type.class'], settings: { foreground: semantic.commentColor.hex } },
    { scope: ['comment.block.documentation entity.name.type'], settings: { foreground: semantic.commentColor.hex } },
    { scope: ['comment.block.documentation variable'], settings: { foreground: semantic.commentColor.hex } },

    // Keywords (and storage modifiers)
    { scope: scopeSets.keywords, settings: { foreground: semantic.keywordColor.hex, ...fs(keywordStyle) } },
    { scope: ['storage.type', 'storage.modifier'], settings: { foreground: semantic.keywordColor.hex, ...fs(keywordStyle) } },

    // Definitions = function declarations and calls
    { scope: scopeSets.functions, settings: { foreground: semantic.definitionColor.hex, ...fs(definitionStyle) } },

    // Types = type, class, interface, enum
    { scope: scopeSets.types, settings: { foreground: semantic.typeColor.hex, ...fs(typeStyle) } },

    // Variables — quiet, near-neutral with palette tint
    { scope: scopeSets.variables, settings: { foreground: semantic.variableColor.hex } },

    // Properties — slightly tinted, distinct from variables
    { scope: scopeSets.properties, settings: { foreground: semantic.propertyColor.hex } },

    // Strings
    { scope: scopeSets.strings, settings: { foreground: semantic.stringColor.hex } },

    // Numbers
    { scope: scopeSets.numbers, settings: { foreground: semantic.numberColor.hex } },

    // Regex internals + escapes
    { scope: scopeSets.regex, settings: { foreground: semantic.regexColor.hex } },

    // Accents: this/self/super, booleans, null
    { scope: scopeSets.accents, settings: { foreground: semantic.accentColor.hex } },

    // Operators
    { scope: scopeSets.operators, settings: { foreground: semantic.operatorColor.hex } },

    // HTML/XML/CSS attributes
    { scope: scopeSets.attributes, settings: { foreground: semantic.definitionColor.hex } },

    // YAML tags / JSON property names
    { scope: ['entity.name.tag.yaml', 'support.type.property-name.json'], settings: { foreground: semantic.propertyColor.hex } },

    // Constants (named, non-numeric)
    { scope: scopeSets.constants, settings: { foreground: semantic.numberColor.hex } },

    // Punctuation — most quiet role
    { scope: scopeSets.punctuation, settings: { foreground: semantic.punctuationColor.hex } },

    // Tags (HTML/XML)
    { scope: scopeSets.tags, settings: { foreground: semantic.keywordColor.hex } },

    // Markdown headings (6-level ramp)
    { scope: scopeSets.markdownH1, settings: { foreground: headingRamp[0], fontStyle: 'bold' } },
    { scope: scopeSets.markdownH2, settings: { foreground: headingRamp[1], fontStyle: 'bold' } },
    { scope: scopeSets.markdownH3, settings: { foreground: headingRamp[2], fontStyle: 'bold' } },
    { scope: scopeSets.markdownH4, settings: { foreground: headingRamp[3] } },
    { scope: scopeSets.markdownH5, settings: { foreground: headingRamp[4] } },
    { scope: scopeSets.markdownH6, settings: { foreground: headingRamp[5] } },

    // Markdown bold / italic — distinct colors per One Dark Pro pattern
    { scope: scopeSets.markdownBold, settings: { foreground: semantic.accentColor.hex, fontStyle: 'bold' } },
    { scope: scopeSets.markdownItalic, settings: { foreground: semantic.keywordColor.hex, fontStyle: 'italic' } },

    // Markdown link / code / quote
    { scope: scopeSets.markdownLink, settings: { foreground: semantic.markdownLinkColor.hex } },
    { scope: scopeSets.markdownCode, settings: { foreground: semantic.stringColor.hex } },
    { scope: scopeSets.markdownQuote, settings: { foreground: semantic.markdownQuoteColor.hex, fontStyle: 'italic' } },
    { scope: scopeSets.markdownListMarker, settings: { foreground: semantic.accentColor.hex } },

    // Diff inline (gutter handled via UI colors)
    { scope: scopeSets.diffInserted, settings: { foreground: semantic.successForeground.hex } },
    { scope: scopeSets.diffRemoved, settings: { foreground: semantic.errorForeground.hex } },
    { scope: scopeSets.diffChanged, settings: { foreground: semantic.warningForeground.hex } },
    { scope: scopeSets.diffHeader, settings: { foreground: semantic.infoForeground.hex } },

    // Invalid / deprecated
    { scope: ['invalid'], settings: { foreground: semantic.errorForeground.hex } },
    { scope: ['invalid.deprecated'], settings: { foreground: semantic.defaultForeground.hex, fontStyle: 'underline' } },

    // Log tags
    { scope: ['log.error'], settings: { foreground: semantic.errorForeground.hex } },
    { scope: ['log.warning'], settings: { foreground: semantic.warningForeground.hex } },
    { scope: ['log.info'], settings: { foreground: semantic.infoForeground.hex } },

    // Filename in diffs
    { scope: ['entity.name.filename'], settings: { foreground: semantic.propertyColor.hex } },

    // GraphQL variables
    { scope: ['meta.selectionset.graphql variable', 'entity.name.fragment.graphql', 'variable.fragment.graphql'], settings: { foreground: semantic.propertyColor.hex } },

    // Meta separator (markdown HR)
    { scope: ['meta.separator.markdown'], settings: { foreground: semantic.punctuationColor.hex } },

    // Markdown error
    { scope: ['markup.error'], settings: { foreground: semantic.errorForeground.hex } },

    // Bracket punctuation — slightly more visible than regular punctuation
    { scope: ['punctuation.definition.arguments.begin', 'punctuation.definition.arguments.end', 'punctuation.definition.entity.begin', 'punctuation.definition.entity.end', 'punctuation.section.scope.begin', 'punctuation.section.scope.end', 'storage.type.generic.java'], settings: { foreground: semantic.punctuationColor.hex } },

    // Template expression punctuation — pop with the accent color
    { scope: ['punctuation.definition.template-expression.begin', 'punctuation.definition.template-expression.end', 'punctuation.section.embedded.begin', 'punctuation.section.embedded.end'], settings: { foreground: semantic.accentColor.hex } },

    // Source shell variable
    { scope: ['source.shell variable.other'], settings: { foreground: semantic.variableColor.hex } },
  ]
}

/**
 * Generate semantic token color rules for VS Code.
 */
export function generateSemanticTokenRules(
  semantic: SemanticColors,
  fontStyleProfile?: PersonalityFontStyleProfile,
): Record<string, string | { foreground?: string; fontStyle?: string }> {
  const commentStyle = fontStyleProfile?.comments !== undefined ? fontStyleProfile.comments : 'italic'
  const keywordStyle = fontStyleProfile?.keywords !== undefined ? fontStyleProfile.keywords : 'italic'
  const definitionStyle = fontStyleProfile?.definitions ?? ''
  const typeStyle = fontStyleProfile?.types ?? ''

  const styled = (hex: string, style: string): string | { foreground: string; fontStyle: string } =>
    style ? { foreground: hex, fontStyle: style } : hex

  return {
    'class': styled(semantic.typeColor.hex, typeStyle),
    'interface': styled(semantic.typeColor.hex, typeStyle),
    'enum': styled(semantic.typeColor.hex, typeStyle),
    'type': styled(semantic.typeColor.hex, typeStyle),
    'struct': styled(semantic.typeColor.hex, typeStyle),
    'typeParameter': styled(semantic.typeColor.hex, typeStyle),
    'function': styled(semantic.definitionColor.hex, definitionStyle),
    'method': styled(semantic.definitionColor.hex, definitionStyle),
    'macro': styled(semantic.definitionColor.hex, definitionStyle),
    'variable': semantic.variableColor.hex,
    'variable.readonly': semantic.accentColor.hex,
    'parameter': semantic.variableColor.hex,
    'property': semantic.propertyColor.hex,
    'enumMember': semantic.numberColor.hex,
    'namespace': styled(semantic.typeColor.hex, typeStyle),
    'keyword': styled(semantic.keywordColor.hex, keywordStyle),
    'modifier': styled(semantic.keywordColor.hex, keywordStyle),
    'string': semantic.stringColor.hex,
    'number': semantic.numberColor.hex,
    'boolean': semantic.accentColor.hex,
    'comment': styled(semantic.commentColor.hex, commentStyle),
    'regexp': semantic.regexColor.hex,
    'operator': semantic.operatorColor.hex,
    'punctuation': semantic.punctuationColor.hex,
    'selfKeyword': semantic.accentColor.hex,
    'builtinConstant': semantic.accentColor.hex,
  }
}
