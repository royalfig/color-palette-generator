import type { ThemeData } from '../types'
import { brightAnsiHex, brightWhiteHex } from '../utils'

/**
 * Alacritty theme (TOML). Reference it from alacritty.toml via:
 *   [general]
 *   import = ["~/.config/alacritty/themes/<file>.toml"]
 * Selection reuses the contrast-checked primary-container pair (see audit note 1);
 * bright white lifts past the foreground via brightWhiteHex (audit note 2).
 */
export function serializeAsAlacritty(data: ThemeData): string {
  const { semanticColors: c, isDarkMode } = data

  const hx = (h: string) => `"${h.slice(0, 7).toLowerCase()}"`
  const bright = (h: string, isBlack = false) => hx(brightAnsiHex(h, isDarkMode, isBlack))

  const lines: string[] = [
    `[colors.primary]`,
    `foreground = ${hx(c.editorForeground.hex)}`,
    `background = ${hx(c.editorBackground.hex)}`,
    ``,
    `[colors.cursor]`,
    `text = ${hx(c.editorBackground.hex)}`,
    `cursor = ${hx(c.cursorColor.hex)}`,
    ``,
    `[colors.selection]`,
    `text = ${hx(c.onPrimaryContainer.hex)}`,
    `background = ${hx(c.primaryContainer.hex)}`,
    ``,
    `[colors.normal]`,
    `black = ${hx(c.terminalAnsiBlack.hex)}`,
    `red = ${hx(c.terminalAnsiRed.hex)}`,
    `green = ${hx(c.terminalAnsiGreen.hex)}`,
    `yellow = ${hx(c.terminalAnsiYellow.hex)}`,
    `blue = ${hx(c.terminalAnsiBlue.hex)}`,
    `magenta = ${hx(c.terminalAnsiMagenta.hex)}`,
    `cyan = ${hx(c.terminalAnsiCyan.hex)}`,
    `white = ${hx(c.terminalAnsiWhite.hex)}`,
    ``,
    `[colors.bright]`,
    `black = ${bright(c.terminalAnsiBlack.hex, true)}`,
    `red = ${bright(c.terminalAnsiRed.hex)}`,
    `green = ${bright(c.terminalAnsiGreen.hex)}`,
    `yellow = ${bright(c.terminalAnsiYellow.hex)}`,
    `blue = ${bright(c.terminalAnsiBlue.hex)}`,
    `magenta = ${bright(c.terminalAnsiMagenta.hex)}`,
    `cyan = ${bright(c.terminalAnsiCyan.hex)}`,
    `white = ${hx(brightWhiteHex(c.terminalAnsiWhite.hex, isDarkMode))}`,
  ]

  return lines.join('\n') + '\n'
}
