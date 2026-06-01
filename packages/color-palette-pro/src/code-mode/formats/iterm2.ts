import type { ThemeData } from '../types'
import { brightAnsiHex } from '../utils'

function hexToFloats(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

function colorDict(hex: string): string {
  const [r, g, b] = hexToFloats(hex)
  return [
    '\t<dict>',
    '\t\t<key>Alpha Component</key>',
    '\t\t<real>1</real>',
    '\t\t<key>Blue Component</key>',
    `\t\t<real>${b}</real>`,
    '\t\t<key>Color Space</key>',
    '\t\t<string>sRGB</string>',
    '\t\t<key>Green Component</key>',
    `\t\t<real>${g}</real>`,
    '\t\t<key>Red Component</key>',
    `\t\t<real>${r}</real>`,
    '\t</dict>',
  ].join('\n')
}

function entry(key: string, hex: string): string {
  return `\t<key>${key}</key>\n${colorDict(hex)}`
}

export function serializeAsIterm2(data: ThemeData): string {
  const { semanticColors: c, isDarkMode } = data

  const bright = (hex: string, isBlack = false) => brightAnsiHex(hex, isDarkMode, isBlack)

  const ansi: [string, string][] = [
    ['Ansi 0 Color', c.terminalAnsiBlack.hex],
    ['Ansi 1 Color', c.terminalAnsiRed.hex],
    ['Ansi 2 Color', c.terminalAnsiGreen.hex],
    ['Ansi 3 Color', c.terminalAnsiYellow.hex],
    ['Ansi 4 Color', c.terminalAnsiBlue.hex],
    ['Ansi 5 Color', c.terminalAnsiMagenta.hex],
    ['Ansi 6 Color', c.terminalAnsiCyan.hex],
    ['Ansi 7 Color', c.terminalAnsiWhite.hex],
    ['Ansi 8 Color', bright(c.terminalAnsiBlack.hex, true)],
    ['Ansi 9 Color', bright(c.terminalAnsiRed.hex)],
    ['Ansi 10 Color', bright(c.terminalAnsiGreen.hex)],
    ['Ansi 11 Color', bright(c.terminalAnsiYellow.hex)],
    ['Ansi 12 Color', bright(c.terminalAnsiBlue.hex)],
    ['Ansi 13 Color', bright(c.terminalAnsiMagenta.hex)],
    ['Ansi 14 Color', bright(c.terminalAnsiCyan.hex)],
    ['Ansi 15 Color', c.editorForeground.hex],
  ]

  const entries = [
    ...ansi.map(([k, v]) => entry(k, v)),
    entry('Background Color', c.editorBackground.hex),
    entry('Bold Color', c.editorForeground.hex),
    entry('Cursor Color', c.cursorColor.hex),
    entry('Cursor Text Color', c.editorBackground.hex),
    entry('Foreground Color', c.editorForeground.hex),
    entry('Link Color', c.infoForeground.hex),
    entry('Selected Text Color', c.editorForeground.hex),
    entry('Selection Color', c.focusBorder.hex),
  ].join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    entries,
    '</dict>',
    '</plist>',
  ].join('\n')
}
