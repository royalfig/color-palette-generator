import { useState, useEffect, useLayoutEffect, useMemo } from 'react'
import { ThemeContext } from './themeContext'
import type { Theme, PaletteKind, PaletteStyle, Mode } from '@/types'
import {
  createPalettes,
  generateCodeThemePair,
  generateCssVariables,
  type ThemeFormat,
} from '@royalfig/color-palette-pro'
import { FORMATS } from '@/lib/const'

/**
 * Generate a random hex color in a pleasing HSL range for theme generation.
 * Saturation 55–80% and lightness 45–65% produce vibrant, readable themes.
 */
function randomPleasingColor(): string {
  const h = Math.floor(Math.random() * 360)
  const s = 55 + Math.floor(Math.random() * 25)
  const l = 45 + Math.floor(Math.random() * 20)

  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let r, g, b
  if (h < 60) {
    r = c
    g = x
    b = 0
  } else if (h < 120) {
    r = x
    g = c
    b = 0
  } else if (h < 180) {
    r = 0
    g = c
    b = x
  } else if (h < 240) {
    r = 0
    g = x
    b = c
  } else if (h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    // migrate the legacy "system" value to the new "dual" mode
    if (stored === 'system') return 'dual'
    return (stored as Theme) || 'dual'
  })

  const [formats, setFormats] = useState<ThemeFormat[]>(() => {
    const stored = localStorage.getItem('formats')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Drop any persisted formats we no longer ship.
          const valid = parsed.filter((f): f is ThemeFormat => FORMATS.some(meta => meta.value === f))
          if (valid.length) return valid
        }
      } catch {
        // ignore malformed persisted value
      }
    }
    return ['vscode']
  })

  useEffect(() => {
    localStorage.setItem('formats', JSON.stringify(formats))
  }, [formats])

  const [mode, setMode] = useState<Mode>(() => {
    const stored = localStorage.getItem('mode')
    return (stored as Mode) || 'theme'
  })

  useEffect(() => {
    localStorage.setItem('mode', mode)
  }, [mode])

  // Resolve the scheme up front (from stored theme + prefers-color-scheme) so
  // the first #color-vars injection already uses the right scheme — otherwise a
  // dark-mode user flashes light-surface before the post-paint effect corrects
  // it. Mirrors the blocking <head> script in index.html.
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    theme === 'dual' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme,
  )

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
      const active = theme === 'dual' ? (mediaQuery.matches ? 'dark' : 'light') : theme
      setResolvedTheme(active)
      root.classList.remove('light', 'dark')
      root.classList.add(active)
      // The blocking <head> script writes color-scheme inline for the first
      // paint; inline styles outrank the .light/.dark class rules, so we must
      // keep it in sync here or native form controls stay frozen at the
      // load-time scheme when the theme (or OS preference, in dual mode) changes.
      root.style.colorScheme = active

      localStorage.setItem('theme', theme)
    }

    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme])

  const [paletteKind, setPaletteKind] = useState<PaletteKind>(() => {
    return (localStorage.getItem('paletteKind') as PaletteKind) || 'tet'
  })

  useEffect(() => {
    localStorage.setItem('paletteKind', paletteKind)
  }, [paletteKind])

  const [paletteStyle, setPaletteStyle] = useState<PaletteStyle>(() => {
    return (localStorage.getItem('paletteStyle') as PaletteStyle) || 'square'
  })

  useEffect(() => {
    localStorage.setItem('paletteStyle', paletteStyle)
    document.documentElement.setAttribute('data-style', paletteStyle)
  }, [paletteStyle])

  const [baseColor, setBaseColor] = useState(() => {
    return localStorage.getItem('baseColor') || randomPleasingColor()
  })

  useEffect(() => {
    localStorage.setItem('baseColor', baseColor)
  }, [baseColor])

  const palette = useMemo(() => {
    return createPalettes(baseColor, paletteKind, paletteStyle, {
      space: 'oklch',
      format: 'hex',
    })
  }, [baseColor, paletteKind, paletteStyle])

  const themePair = useMemo(() => {
    const base = palette.find(c => c.isBase)!
    return generateCodeThemePair(base.color, palette, paletteKind, paletteStyle)
  }, [palette, paletteKind, paletteStyle])

  const activeTheme = resolvedTheme === 'dark' ? themePair.dark : themePair.light

  // UI color variables for both schemes, as bare `--var: value;` declarations
  // (wrapper "none"). The copy-snippet CSS scopes these to .cc-light / .cc-dark
  // so a copied block is styled without the app's runtime injection.
  const uiVarsPair = useMemo(() => {
    const make = (isDarkMode: boolean) => {
      const uiPalette = createPalettes(
        baseColor,
        paletteKind,
        paletteStyle,
        { space: 'oklch', format: 'hex' },
        undefined,
        true,
        isDarkMode,
      )
      return {
        css: generateCssVariables(uiPalette, {
          format: 'hex',
          isUiMode: true,
          wrapper: 'none',
          style: paletteStyle,
        }),
        palette: uiPalette,
      }
    }
    return { light: make(false), dark: make(true) }
  }, [baseColor, paletteKind, paletteStyle])

  // Persist each scheme's surface color so the blocking <head> script in
  // index.html can paint the correct background before first paint — the
  // generated --color-* vars don't exist yet on a cold load.
  useEffect(() => {
    const light = uiVarsPair.light.palette.find(c => c.code === 'surface')?.string
    const dark = uiVarsPair.dark.palette.find(c => c.code === 'surface')?.string
    if (light) localStorage.setItem('bg-light', light)
    if (dark) localStorage.setItem('bg-dark', dark)
  }, [uiVarsPair])

  useLayoutEffect(() => {
    const uiPalette = createPalettes(
      baseColor,
      paletteKind,
      paletteStyle,
      { space: 'oklch', format: 'hex' },
      undefined,
      true,
      resolvedTheme === 'dark',
    )

    const uiVars = generateCssVariables(uiPalette, {
      format: 'hex',
      isUiMode: true,
      wrapper: 'root',
      style: paletteStyle,
    })

    const styleEl = document.createElement('style')
    styleEl.id = 'color-vars'
    styleEl.innerHTML = uiVars

    const existing = document.getElementById('color-vars')
    if (existing) existing.replaceWith(styleEl)
    else document.head.append(styleEl)
  }, [baseColor, paletteKind, paletteStyle, resolvedTheme])

  useLayoutEffect(() => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const colors = palette.map(c => c.cssValue)
    const count = Math.min(colors.length, 5)
    const pad = 4
    const innerSize = size - pad * 2
    const bandH = innerSize / count

    ctx.fillStyle = '#12121f'
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, 12)
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(pad, pad, innerSize, innerSize, 8)
    ctx.clip()

    for (let i = 0; i < count; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(pad, pad + i * bandH, innerSize, bandH)
    }

    ctx.restore()

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (link) link.href = canvas.toDataURL('image/png')
  }, [palette])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        paletteKind,
        setPaletteKind,
        paletteStyle,
        setPaletteStyle,
        baseColor,
        setBaseColor,
        activeTheme,
        themePair,
        uiVarsPair,
        palette,
        mode,
        setMode,
        formats,
        setFormats,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
