import type { ThemeData } from '../types'
import { brightAnsiHex, brightWhiteHex } from '../utils'

/**
 * Warp theme (YAML). Drop the file in ~/.warp/themes/ and pick it in Settings → Appearance.
 * `details` flags whether the background is dark or light so Warp picks matching chrome.
 * `accent` drives Warp's UI highlights; we feed it the same UI accent VSCode/Zed use.
 * Bright white lifts past the foreground via brightWhiteHex (see audit note 2) like the
 * other terminal formats.
 */
export function serializeAsWarp(data: ThemeData): string {
  const { semanticColors: c, isDarkMode, displayName } = data

  const hx = (h: string) => `"${h.slice(0, 7).toLowerCase()}"`
  const bright = (h: string, isBlack = false) => hx(brightAnsiHex(h, isDarkMode, isBlack))

  const lines: string[] = [
    `name: ${displayName}`,
    `accent: ${hx(c.focusBorder.hex)}`,
    `cursor: ${hx(c.cursorColor.hex)}`,
    `background: ${hx(c.editorBackground.hex)}`,
    `foreground: ${hx(c.editorForeground.hex)}`,
    `details: ${isDarkMode ? 'darker' : 'lighter'}`,
    `terminal_colors:`,
    `  normal:`,
    `    black: ${hx(c.terminalAnsiBlack.hex)}`,
    `    red: ${hx(c.terminalAnsiRed.hex)}`,
    `    green: ${hx(c.terminalAnsiGreen.hex)}`,
    `    yellow: ${hx(c.terminalAnsiYellow.hex)}`,
    `    blue: ${hx(c.terminalAnsiBlue.hex)}`,
    `    magenta: ${hx(c.terminalAnsiMagenta.hex)}`,
    `    cyan: ${hx(c.terminalAnsiCyan.hex)}`,
    `    white: ${hx(c.terminalAnsiWhite.hex)}`,
    `  bright:`,
    `    black: ${bright(c.terminalAnsiBlack.hex, true)}`,
    `    red: ${bright(c.terminalAnsiRed.hex)}`,
    `    green: ${bright(c.terminalAnsiGreen.hex)}`,
    `    yellow: ${bright(c.terminalAnsiYellow.hex)}`,
    `    blue: ${bright(c.terminalAnsiBlue.hex)}`,
    `    magenta: ${bright(c.terminalAnsiMagenta.hex)}`,
    `    cyan: ${bright(c.terminalAnsiCyan.hex)}`,
    `    white: ${hx(brightWhiteHex(c.terminalAnsiWhite.hex, isDarkMode))}`,
  ]

  return lines.join('\n') + '\n'
}
