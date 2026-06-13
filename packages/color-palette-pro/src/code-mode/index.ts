import Color from 'colorjs.io'
import { PaletteKinds, PaletteStyle } from '../types'
import type {
  BaseColorData,
  CodeThemeOutput,
  CodeThemeTemplate,
  ModeBands,
  PaletteCharacter,
  SemanticColors,
  SurfaceBundle,
  SyntaxAccentRole,
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
  findColorByHue, toHex, shiftHue, desaturate,
  ensureAPCAAgainst, capAPCAAgainst, clipToSRGB, deltaE, nudgeForDistinction,
  nudgeLightnessForDistinction, mixColors, tintTowardHue,
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

const KIND_NAMES: Record<PaletteKinds, { slug: string; displayName: string }> = {
  ana: { slug: 'analogous', displayName: 'Analogous' },
  com: { slug: 'complementary', displayName: 'Complementary' },
  spl: { slug: 'split-complementary', displayName: 'Split Complementary' },
  tet: { slug: 'tetradic', displayName: 'Tetradic' },
  tri: { slug: 'triadic', displayName: 'Triadic' },
  tas: { slug: 'tints-and-shades', displayName: 'Tints & Shades' },
  ton: { slug: 'tones', displayName: 'Tones' },
}

const STYLE_NAMES: Record<PaletteStyle, { slug: string; displayName: string }> = {
  square: { slug: 'square', displayName: 'Square' },
  triangle: { slug: 'triangle', displayName: 'Triangle' },
  circle: { slug: 'circle', displayName: 'Circle' },
  diamond: { slug: 'diamond', displayName: 'Diamond' },
}

/** Distinct name per (kind × style): "Analogous Circle" / "analogous-circle-dark". */
function themeNames(kind: PaletteKinds, style: PaletteStyle): { dark: string; light: string; displayName: string } {
  const k = KIND_NAMES[kind]
  const s = STYLE_NAMES[style]
  return {
    dark: `${k.slug}-${s.slug}-dark`,
    light: `${k.slug}-${s.slug}-light`,
    displayName: `${k.displayName} ${s.displayName}`,
  }
}

const LOUD_ROLES = ['definitionColor', 'keywordColor', 'typeColor', 'stringColor', 'numberColor', 'regexColor', 'accentColor'] as const

// Roles whose visual distinctness matters, ordered by typical token frequency in code.
// Frequency-weighted enforcement: high-frequency roles claim hue space first; less-frequent
// roles adapt around them. keyword and string dominate most languages; type is rarest.
const DISTINCT_ROLES_BY_FREQ = ['keywordColor', 'stringColor', 'definitionColor', 'numberColor', 'typeColor'] as const

// Role hue conventions, measured across the top-marketplace corpus (dark themes;
// light themes follow the same families). Each role has one or two anchor hues:
//   strings:   warm-to-green (14/15 themes in 30–146)
//   keywords:  purple/magenta 300–350 or blue 230–250
//   functions: blue ~245–265 or yellow ~107
//   types:     teal/cyan 160–220 or gold ~80
//   numbers:   warm orange 7–63 or purple ~300 (Dracula school)
// The matcher permutes the template's loud colors among these roles to honor the
// conventions — same palette, conventional placement.
const ROLE_HUE_ANCHORS: Record<(typeof DISTINCT_ROLES_BY_FREQ)[number], number[]> = {
  keywordColor:    [315, 240],
  stringColor:     [120, 45],
  definitionColor: [255, 105],
  numberColor:     [40, 310],
  typeColor:       [190, 80],
}

function hueGapDeg(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Reassign the five distinct loud colors among their roles so each role lands on
 * the palette hue closest to its convention (brute-force over the 120 permutations,
 * chroma-weighted so near-neutral colors are free to take any role). People read
 * "green = string, purple = keyword" before they read the palette's geometry.
 */
function applyHueConventions(syntax: SyntaxColors): SyntaxColors {
  const roles = DISTINCT_ROLES_BY_FREQ
  const colors = roles.map((r) => (syntax as any)[r] as Color)

  // Penalize red placements on red-sensitive roles so the permutation routes red
  // swatches to keyword (whose scope set also paints tags) or type instead. Gated
  // at low raw chroma — band normalization raises chroma later.
  const cost = (role: (typeof roles)[number], color: Color): number => {
    const c = color.oklch.c ?? 0
    const w = Math.min(c, 0.12) / 0.12
    const h = color.oklch.h ?? 0
    let base = Math.min(...ROLE_HUE_ANCHORS[role].map((a) => hueGapDeg(h, a)))
    if (RED_SENSITIVE_ROLES.has(role) && c >= 0.03 && hueGapDeg(h, 5) <= 20) base += 80
    return w * base
  }

  let bestPerm: number[] | null = null
  let bestCost = Infinity
  const permute = (idx: number[], rest: number[]): void => {
    if (rest.length === 0) {
      let total = 0
      for (let i = 0; i < roles.length; i++) total += cost(roles[i], colors[idx[i]])
      if (total < bestCost) {
        bestCost = total
        bestPerm = [...idx]
      }
      return
    }
    for (let i = 0; i < rest.length; i++) {
      permute([...idx, rest[i]], rest.filter((_, j) => j !== i))
    }
  }
  permute([], [0, 1, 2, 3, 4])

  const out = { ...syntax }
  if (bestPerm) {
    for (let i = 0; i < roles.length; i++) {
      ;(out as any)[roles[i]] = colors[(bestPerm as number[])[i]].clone()
    }
  }
  return out
}

// APCA contrast targets (perceptual; Lc scale):
//   75 = body text (the gold standard)
//   60 = fluent text (acceptable for syntax tokens)
//   45 = incidental UI text
//   30 = decorative / spot text
const APCA_TARGET_LOUD = 60
const APCA_TARGET_QUIET = 45

// Comments are a *band*, not just a floor: the exemplar themes run comments at
// Lc 18–52 (Nord 21, One Dark 18, Dark Modern 41, One Light 52) — clearly recessed.
// We hold them slightly above the exemplar low end for readability, but cap them
// so they never compete with code. Light bgs need more Lc for the same recessed feel.
const APCA_COMMENT_MIN = 30
const APCA_COMMENT_MAX_DARK = 44
const APCA_COMMENT_MAX_LIGHT = 52
const APCA_TARGET_SELECTION_OVERLAY = 30

// Quiet-role chroma tiers (measured from exemplars): identifiers (variable/property)
// carry a real tint — Dark Modern's variable #9CDCFE is C 0.109 — while structural
// glue (operator/punctuation) and comments stay close to neutral.
const STRUCTURAL_C_MAX = 0.04
const COMMENT_C_MAX = 0.05

const IDENTIFIER_ROLES = ['variableColor', 'propertyColor'] as const
const STRUCTURAL_ROLES = ['operatorColor', 'punctuationColor'] as const

// Red (≈345–25°) is reserved vocabulary: the corpus uses it for tags, operators and
// keywords, never strings/functions and almost never numbers — a saturated red
// string reads as an error. These roles avoid the zone at every pipeline stage.
const RED_SENSITIVE_ROLES: ReadonlySet<string> = new Set(['stringColor', 'definitionColor', 'numberColor'])

function isErrorRed(c: Color): boolean {
  return (c.oklch.c ?? 0) >= 0.10 && hueGapDeg(c.oklch.h ?? 0, 5) <= 20
}

/**
 * Normalize syntax colors into the lens's token bands — the core "shape" move.
 * Every exemplar theme holds its loud tokens in a narrow L band with a consistent
 * chroma ceiling; identity comes from which roles carry the chroma peak.
 *
 * Loud roles: rank-preserving linear remap of observed L and C into the band.
 * Accent roles (character-chosen) get the band's chroma peak; everything else is
 * compressed below it. Quiet roles clamp (their tiering is already deliberate).
 */
function normalizeToBands(
  syntax: SyntaxColors,
  bands: ModeBands,
  accentRoles: SyntaxAccentRole[],
  isDarkMode: boolean,
): SyntaxColors {
  const { loud, quiet } = bands
  const out = { ...syntax }

  const remap = (v: number, lo0: number, hi0: number, lo1: number, hi1: number): number => {
    if (hi0 - lo0 < 0.015) return (lo1 + hi1) / 2 + (v - (lo0 + hi0) / 2)
    return lo1 + ((v - lo0) / (hi0 - lo0)) * (hi1 - lo1)
  }

  const ls = LOUD_ROLES.map((k) => (syntax as any)[k].oklch.l ?? 0.5)
  const cs = LOUD_ROLES.map((k) => (syntax as any)[k].oklch.c ?? 0)
  const [lMin, lMax] = [Math.min(...ls), Math.max(...ls)]
  const [cMin, cMax] = [Math.min(...cs), Math.max(...cs)]

  // Non-accent roles top out below the band peak so the accent reads as *the* accent.
  const cHiCompressed = loud.cLo + (loud.cHi - loud.cLo) * 0.75

  // Hand-tuned themes track each hue's natural lightness — Dark Modern's yellow
  // function sits at L 0.88 while its blue keyword sits at 0.67. Blending the
  // remapped L with a hue-natural target reproduces that, and rescues the case
  // where the template's raw L range is degenerate (everything clamped equal).
  const lMid = (loud.lLo + loud.lHi) / 2
  const lHalf = (loud.lHi - loud.lLo) / 2
  const hueNaturalL = (h: number): number => lMid + Math.cos(((h - 100) * Math.PI) / 180) * lHalf

  for (const k of LOUD_ROLES) {
    const c = ((syntax as any)[k] as Color).clone()
    const remapped = remap(c.oklch.l ?? 0.5, lMin, lMax, loud.lLo, loud.lHi)
    const blended = remapped * 0.55 + hueNaturalL(c.oklch.h ?? 0) * 0.45
    c.oklch.l = Math.max(loud.lLo, Math.min(loud.lHi, blended))
    if (accentRoles.includes(k as SyntaxAccentRole)) {
      c.oklch.c = loud.cHi
    } else {
      c.oklch.c = Math.max(loud.cLo, Math.min(cHiCompressed, remap(c.oklch.c ?? 0, cMin, cMax, loud.cLo, cHiCompressed)))
      // Pastel tilt (dark themes only): measured corpus covariance r(L,C) ≈ −0.49 —
      // brighter tokens go pastel, dimmer tokens stay saturated. Light themes show
      // no such coupling.
      if (isDarkMode && lHalf > 0.001) {
        const tilt = 1 - 0.22 * (((c.oklch.l ?? lMid) - lMid) / lHalf)
        c.oklch.c = Math.max(loud.cLo * 0.85, Math.min(loud.cHi, (c.oklch.c ?? 0) * tilt))
      }
    }
    // Saturated red on a red-sensitive role (palettes whose complement/triad IS red):
    // shift to orange — keeps the warmth, sheds the error-red read. Pastel reds pass.
    if (RED_SENSITIVE_ROLES.has(k) && isErrorRed(c)) c.oklch.h = 30
    // Clip to gamut now: downstream distinction must see what will actually render.
    ;(out as any)[k] = clipToSRGB(c)
  }

  for (const k of IDENTIFIER_ROLES) {
    const c = ((syntax as any)[k] as Color).clone()
    c.oklch.l = Math.max(quiet.lLo, Math.min(quiet.lHi, c.oklch.l ?? 0.7))
    // Identifiers carry a real tint in the exemplars (Dark Modern variable C 0.109) —
    // floor as well as cap, so variables never collapse to gray. Their hue is linked
    // to a loud family after distinction settles (linkIdentifierFamily).
    c.oklch.c = Math.max(quiet.cHi * 0.6, Math.min(quiet.cHi, c.oklch.c ?? 0))
    ;(out as any)[k] = c
  }
  for (const k of STRUCTURAL_ROLES) {
    const c = ((syntax as any)[k] as Color).clone()
    // structural glue may sit a touch below the identifier band
    const lo = isDarkMode ? quiet.lLo - 0.06 : quiet.lLo
    const hi = isDarkMode ? quiet.lHi : quiet.lHi + 0.06
    c.oklch.l = Math.max(lo, Math.min(hi, c.oklch.l ?? 0.7))
    c.oklch.c = Math.min(STRUCTURAL_C_MAX, c.oklch.c ?? 0)
    ;(out as any)[k] = c
  }
  {
    const c = syntax.commentColor.clone()
    c.oklch.c = Math.min(COMMENT_C_MAX, c.oklch.c ?? 0)
    out.commentColor = c
  }

  return out
}

/**
 * Identifiers join an existing loud family instead of keeping a generic base-hue
 * tint — the corpus puts variables in the cool structural family (Dark Modern's
 * #9CDCFE rides the keyword blue). Runs *after* distinction so the link targets
 * the final loud hues; identifiers keep their own quiet-band L/C.
 */
function linkIdentifierFamily(syntax: SyntaxColors, bg: Color): SyntaxColors {
  let familyHue: number | null = null
  let bestGap = Infinity
  for (const k of LOUD_ROLES) {
    const c = (syntax as any)[k] as Color
    if ((c.oklch.c ?? 0) < 0.05) continue
    const g = hueGapDeg(c.oklch.h ?? 0, 250)
    if (g < bestGap) {
      bestGap = g
      familyHue = c.oklch.h ?? 0
    }
  }
  if (familyHue === null) return syntax
  const out = { ...syntax }
  for (const k of IDENTIFIER_ROLES) {
    const c = ((syntax as any)[k] as Color).clone()
    c.oklch.h = familyHue
    ;(out as any)[k] = ensureAPCAAgainst(clipToSRGB(c), bg, APCA_TARGET_QUIET)
  }
  return out
}

/**
 * Pick the bg tint hue: the palette hue closest to blue-violet (~265). Measured rule —
 * 10 of 13 chromatically-tinted dark bgs in the corpus sit at h 243–291 regardless of
 * the token palette; a cool ink reads "professional dark theme". Mono palettes simply
 * return their own family (Gruvbox-style warm inks are a mono identity, not an error).
 */
const BG_TINT_ANCHOR = 265

function coolestPaletteHue(palette: BaseColorData[], fallback: number): number {
  let best = fallback
  let bestGap = Infinity
  for (const item of palette) {
    const c = item?.color
    if (!c || (c.oklch.c ?? 0) < 0.04) continue
    const h = c.oklch.h ?? 0
    const gap = hueGapDeg(h, BG_TINT_ANCHOR)
    if (gap < bestGap) {
      bestGap = gap
      best = h
    }
  }
  return best
}

/**
 * Comment hue rule from the corpus: comments are either tinted with the bg's own hue
 * (Nord, One Dark, Dracula, Tokyo Night — Δhue vs bg ≤ 13°) or go green (the VS Code /
 * Vitesse school) — and in nearly every theme they sit ≥ 90° from the string hue so
 * comments never read as strings. If the template left the comment too close to the
 * string family, re-aim it at whichever candidate hue lands farthest from strings.
 */
function adjustCommentHue(syntax: SyntaxColors, bg: Color): SyntaxColors {
  const comment = syntax.commentColor
  const cChroma = comment.oklch.c ?? 0
  if (cChroma < 0.012) return syntax // effectively gray — hue is moot
  const stringH = syntax.stringColor.oklch.h ?? 0
  if (hueGapDeg(comment.oklch.h ?? 0, stringH) >= 60) return syntax

  const candidates: number[] = [265, 135]
  if ((bg.oklch.c ?? 0) > 0.006) candidates.unshift(bg.oklch.h ?? 265)
  let best = candidates[0]
  let bestGap = -1
  for (const h of candidates) {
    const gap = hueGapDeg(h, stringH)
    if (gap > bestGap) {
      bestGap = gap
      best = h
    }
  }
  const out = { ...syntax }
  const c = comment.clone()
  c.oklch.h = best
  out.commentColor = c
  return out
}

/**
 * Walk each role and bump along L until it meets a perceptual contrast target (APCA Lc)
 * against the *actual* editor background. Loud roles target Lc 60, quiet roles Lc 45,
 * and comments are held inside a recessed Lc band (floor *and* ceiling).
 */
function ensureRoleContrast(syntax: SyntaxColors, bg: Color, isDarkMode: boolean): SyntaxColors {
  const out = { ...syntax }
  for (const k of LOUD_ROLES) (out as any)[k] = ensureAPCAAgainst((syntax as any)[k], bg, APCA_TARGET_LOUD)
  for (const k of [...IDENTIFIER_ROLES, ...STRUCTURAL_ROLES]) {
    ;(out as any)[k] = ensureAPCAAgainst((syntax as any)[k], bg, APCA_TARGET_QUIET)
  }
  out.commentColor = capAPCAAgainst(
    ensureAPCAAgainst(syntax.commentColor, bg, APCA_COMMENT_MIN),
    bg,
    isDarkMode ? APCA_COMMENT_MAX_DARK : APCA_COMMENT_MAX_LIGHT,
  )
  return out
}

/**
 * Frequency-weighted distinction. Iterate DISTINCT_ROLES in descending token-frequency
 * order; high-frequency roles "anchor" the space and lower-frequency roles nudge around
 * them. Polychrome palettes separate by rotating hue; monochromatic palettes separate
 * by stepping lightness (the Kanagawa strategy) so the single-hue identity survives.
 *
 * This must run *after* the APCA floor pass: contrast lifts compress lightness
 * differences and would re-collide separated pairs. To keep nudged colors legible,
 * every candidate is re-floored against the actual editor bg *inside* the loop, so
 * the convergence check always sees final values.
 */
function enforceDistinction(
  syntax: SyntaxColors,
  bg: Color,
  isDarkMode: boolean,
  monoIdentity: boolean,
  minDeltaE = 8,
): SyntaxColors {
  const out = { ...syntax }
  const roles = DISTINCT_ROLES_BY_FREQ
  const nudge = monoIdentity ? nudgeLightnessForDistinction : nudgeForDistinction
  const finalize = (c: Color): Color => ensureAPCAAgainst(clipToSRGB(c), bg, APCA_TARGET_LOUD)

  // Hue nudges must not rotate red-sensitive roles *through* the red zone. If a
  // nudge lands one of them in 345–25° at visible chroma, skip it past the zone.
  const avoidRed = (c: Color, role: string): Color => {
    if (!RED_SENSITIVE_ROLES.has(role) || (c.oklch.c ?? 0) < 0.06) return c
    const h = c.oklch.h ?? 0
    if (hueGapDeg(h, 5) > 20) return c
    const o = c.clone()
    const signed = ((h - 5 + 540) % 360) - 180
    o.oklch.h = signed >= 0 ? 30 : 340
    return o
  }

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const a = (out as any)[roles[i]] as Color
        const b = (out as any)[roles[j]] as Color
        if (deltaE(a, b) < minDeltaE) {
          (out as any)[roles[j]] = finalize(avoidRed(nudge(b, a, isDarkMode), roles[j]))
        }
      }
    }
  }
  // Fallback passes: a role wedged between hue anchors can oscillate without ever
  // separating (resolving one pair pushes it onto another role — musical chairs).
  // Step L instead, evaluating both directions against *all* distinct roles so a
  // nudge never lands on a third color, and escalate the stride each pass (a color
  // clamped at a band edge can only escape by jumping past its anchor).
  const [lMin, lMax] = isDarkMode ? [0.62, 0.93] : [0.34, 0.66]
  const candidateAt = (b: Color, l: number, cDelta = 0.01): Color => {
    const c = b.clone()
    c.oklch.l = l
    c.oklch.c = Math.max(0.04, Math.min(0.17, (c.oklch.c ?? 0) + cDelta))
    return finalize(c)
  }
  for (let pass = 0; pass < 6; pass++) {
    let collisions = 0
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const a = (out as any)[roles[i]] as Color
        const b = (out as any)[roles[j]] as Color
        const dE = deltaE(a, b)
        if (dE < minDeltaE) {
          collisions++
          const step = (0.07 + Math.max(0, (minDeltaE - dE) / 100)) * (pass + 1)
          const bl = b.oklch.l ?? 0.5
          // Candidates along both axes — five roles don't always fit in the L range
          // alone (mono light themes), so chroma tiers are the second dimension.
          const candidates = [
            candidateAt(b, Math.min(lMax, bl + step)),
            candidateAt(b, Math.max(lMin, bl - step)),
            candidateAt(b, bl, +0.06),
            candidateAt(b, bl, -0.06),
            candidateAt(b, Math.min(lMax, bl + step), -0.05),
            candidateAt(b, Math.max(lMin, bl - step), +0.05),
          ]
          const others = roles.filter((r) => r !== roles[j]).map((r) => (out as any)[r] as Color)
          const minDE = (c: Color): number => Math.min(...others.map((o) => deltaE(c, o)))
          let best = candidates[0]
          let bestScore = minDE(best)
          for (const cand of candidates.slice(1)) {
            const score = minDE(cand)
            if (score > bestScore) {
              best = cand
              bestScore = score
            }
          }
          ;(out as any)[roles[j]] = best
        }
      }
    }
    if (collisions === 0) break
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
    // Caps calibrated to exemplar editor surfaces: Night Owl C ≈ 0.045 (dark),
    // light exemplars stay near-neutral. The tint hue prefers the palette's
    // coolest member (blue-violet anchor) rather than the primary.
    editorBgBase.oklch.h = coolestPaletteHue(palette, primary.oklch.h ?? 0)
    if (isDarkMode) {
      editorBgBase.oklch.c = Math.min((editorBgBase.oklch.c ?? 0) + personality.bgTint.chromaBoost, 0.045)
    } else {
      editorBgBase.oklch.c = Math.min((editorBgBase.oklch.c ?? 0) + personality.bgTint.chromaBoost * 0.35, 0.014)
    }
  }
  const bgModeOffset = isDarkMode ? personality.bgOffset.dark : personality.bgOffset.light
  if (bgModeOffset !== 0) {
    const [lMin, lMax] = isDarkMode ? [0.12, 0.26] : [0.95, 1.00]
    editorBgBase.oklch.l = Math.max(lMin, Math.min(lMax, (editorBgBase.oklch.l ?? 0.17) + bgModeOffset))
  }

  // Chrome chroma discipline (measured from the top-theme corpus): themes are
  // bimodal. The neutral school (Dark Modern, Vitesse, min-light) holds every
  // chrome surface at chroma ≤ 0.003; the tinted school (Nord, Dracula, Night Owl,
  // Tokyo Night) tints chrome with the *editor bg's* hue and never lets chrome
  // exceed the bg's own chroma by more than a whisper.
  if (sp.chromeNeutral) {
    editorBgBase.oklch.c = Math.min(editorBgBase.oklch.c ?? 0, 0.003)
  }
  const bgChromaCeiling = (editorBgBase.oklch.c ?? 0) + 0.006
  const clampChrome = (c: Color): Color => {
    const out = c.clone()
    if (sp.chromeNeutral) {
      out.oklch.c = Math.min(out.oklch.c ?? 0, 0.003)
    } else {
      out.oklch.h = editorBgBase.oklch.h ?? out.oklch.h
      out.oklch.c = Math.min(out.oklch.c ?? 0, bgChromaCeiling)
    }
    return out
  }

  const sidebarRouteKey = isDarkMode ? sp.sidebarSurface.dark : sp.sidebarSurface.light
  const sidebarBg = clampChrome(sidebarRouteKey === 'container' ? surfaces.container : surfaces.containerSunken)
  if (sp.chromeTint) {
    // Tinted chrome shares the *bg's* hue (corpus rule), not the primary's.
    sidebarBg.oklch.h = editorBgBase.oklch.h ?? primary.oklch.h
    sidebarBg.oklch.c = Math.min((sidebarBg.oklch.c ?? 0) + 0.006, bgChromaCeiling, isDarkMode ? 0.020 : 0.010)
  }
  const panelBg = sidebarBg.clone()
  const overlayBg = clampChrome(surfaces.containerOverlay)

  const inputSunken = clampChrome(isDarkMode
    ? surfaces.containerOverlay
    : mixColors(surfaces.surface, surfaces.containerSunken, 0.3))

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

  const neutralBandBase = clampChrome(isDarkMode
    ? mixColors(surfaces.container, surfaces.containerOverlay, 0.5)
    : mixColors(surfaces.surface, surfaces.containerSunken, 0.4))
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

  // Info/link/ANSI-blue must read as *blue* (h ~205–255). Prefer a real blue palette
  // member, but pin the hue into the blue band when the palette has none — a green
  // "info" colour breaks links and ANSI 4 (the chartreuse-complement failure mode).
  const infoFromPalette = findColorByHue(palette, 235, 30)
  const infoColor = (infoFromPalette ?? (() => {
    const fb = primary.clone()
    fb.oklch.c = Math.min((primary.oklch.c ?? 0) * 0.9, 0.13)
    return fb
  })()).clone()
  {
    const signed = ((( infoColor.oklch.h ?? 235) - 235 + 540) % 360) - 180
    infoColor.oklch.h = (235 + Math.max(-30, Math.min(30, signed)) + 360) % 360
  }
  infoColor.oklch.l = isDarkMode ? 0.75 : 0.45
  const infoContainerPair = makeContainerForAccent(infoColor, isDarkMode)

  const rawSyntax = template.deriveColors(baseColor, palette, isDarkMode, surfaces)
  // Convention matching first: permute the loud colors among roles so strings land
  // warm/green, keywords purple/blue, etc. — before band normalization assigns the
  // character's accent chroma to its roles.
  const conventionalSyntax = applyHueConventions(rawSyntax)
  const modeBands = isDarkMode ? personality.tokenBands.dark : personality.tokenBands.light
  const bandedSyntax = normalizeToBands(conventionalSyntax, modeBands, personality.accentRoles, isDarkMode)
  const commentedSyntax = adjustCommentHue(bandedSyntax, editorBgBase)
  // Contrast floor first, then distinction: APCA lifts compress L differences, so
  // running them after separation would re-collide pairs. Distinction re-floors its
  // own nudges against the real bg internally.
  const contrastedSyntax = ensureRoleContrast(commentedSyntax, editorBgBase, isDarkMode)
  const distinctSyntax = enforceDistinction(
    contrastedSyntax,
    editorBgBase,
    isDarkMode,
    personality.paletteCharacter === 'mono',
    // Light themes keep their roles further apart (corpus p10: 8.0 dark, 10.7 light).
    isDarkMode ? 8 : 10,
  )
  const syntax = linkIdentifierFamily(distinctSyntax, editorBgBase)

  const rawBracketPairs = template.deriveBracketPairs(baseColor, palette, isDarkMode)
  const bracketPairColors = rawBracketPairs.map(toHex)

  const markdownQuote = desaturate(syntax.stringColor.clone(), 0.4)

  // Comments are solid in both modes — every exemplar uses opaque comment colors,
  // and the recessed feel now comes from the APCA comment band instead of alpha.
  const commentHex = toHex(syntax.commentColor)
  const punctuationHex = toHex(syntax.punctuationColor)

  const cursorColor = sp.cursorSource === 'foreground'
    ? surfaces.onSurface.clone()
    : syntax.accentColor.clone()

  // UI accent: the corpus draws focusBorder/buttons/badges from the *token palette*,
  // preferring the cool structural family (h 233–299 in 18 of 22 themes; Vitesse's
  // green accent is a palette-identity exception, which this reproduces for
  // cool-less palettes). Reusing the final token color keeps accent ≡ token (ΔE 0).
  const uiAccent = (() => {
    const candidates = [syntax.definitionColor, syntax.keywordColor, syntax.typeColor, syntax.numberColor, syntax.accentColor]
    let best: Color | null = null
    let bestGap = Infinity
    for (const c of candidates) {
      if ((c.oklch.c ?? 0) < 0.05) continue
      const g = hueGapDeg(c.oklch.h ?? 0, 265)
      if (g < bestGap) {
        bestGap = g
        best = c
      }
    }
    return (best ?? primary).clone()
  })()

  // Editor foreground: tinted themes carry the bg hue into the fg at a whisper
  // (corpus Δhue vs bg ≤ 16°, C median ≈ 0.02); the neutral school stays at C 0.
  const editorFg = (() => {
    const fg = surfaces.onSurface.clone()
    if (!sp.chromeNeutral && (editorBgBase.oklch.c ?? 0) > 0.006) {
      fg.oklch.h = editorBgBase.oklch.h
      fg.oklch.c = Math.min(0.022, Math.max(fg.oklch.c ?? 0, isDarkMode ? 0.016 : 0.010))
    }
    return fg
  })()

  // ANSI palette echoes the *editor's* syntax colours (the Dracula/Nord/Tokyo-Night
  // approach — a terminal that matches the editor) while staying terminal-correct.
  // For each slot we take the syntax token nearest its canonical hue, clamp the hue
  // into a ±28° band so `ls`/`git`/`tmux` semantics hold, and floor to APCA Lc 45.
  // When no token reaches a hue family (mono palettes, warm-only palettes), a
  // canonical colour is synthesised so the slot is never the wrong colour.
  //
  // The convention mapping aligns by construction: string→green, definition(function)
  // →blue, keyword→magenta, type→cyan, number→yellow. Red stays sourced from `error`
  // because red is reserved vocabulary the syntax palette deliberately avoids.
  const ansiFloor = (c: Color): Color => ensureAPCAAgainst(c, editorBgBase, 45)
  const deriveAnsi = (targetHue: number, candidates: Color[]): Color => {
    let chosen: Color | null = null
    let bestGap = Infinity
    for (const cand of candidates) {
      if ((cand.oklch.c ?? 0) < 0.04) continue
      const g = hueGapDeg(cand.oklch.h ?? 0, targetHue)
      if (g < bestGap) { bestGap = g; chosen = cand }
    }
    const out = (chosen ?? candidates[candidates.length - 1]).clone()
    if (!chosen || bestGap > 50) {
      // No token in this hue family — synthesise a readable canonical colour.
      out.oklch.h = targetHue
      out.oklch.c = 0.11
      out.oklch.l = isDarkMode ? 0.72 : 0.50
    } else {
      const signed = ((out.oklch.h ?? targetHue) - targetHue + 540) % 360 - 180
      out.oklch.h = (targetHue + Math.max(-28, Math.min(28, signed)) + 360) % 360
      out.oklch.c = Math.max(out.oklch.c ?? 0, 0.08)
    }
    return ansiFloor(out)
  }

  const ansiRed = deriveAnsi(25, [semantics.error])
  const ansiGreen = deriveAnsi(145, [syntax.stringColor, semantics.success])
  const ansiYellow = deriveAnsi(95, [syntax.numberColor, semantics.warning])
  const ansiBlue = deriveAnsi(250, [syntax.definitionColor, infoColor])
  const ansiMagenta = deriveAnsi(330, [syntax.keywordColor, syntax.accentColor])
  const ansiCyan = deriveAnsi(200, [syntax.typeColor, syntax.regexColor])

  // ANSI black is conventionally dark in *both* modes (deriving it from onSurface
  // made it near-white in dark themes). A lifted near-black keeps `ls`/`git` output
  // readable against the terminal bg while still reading as "black".
  const ansiBlack = (() => {
    const c = surfaces.onSurface.clone()
    c.oklch.c = Math.min((c.oklch.c ?? 0) * 0.3, 0.01)
    c.oklch.l = isDarkMode ? 0.38 : 0.25
    return c
  })()

  const semanticColors: SemanticColors = {
    editorBackground: { hex: toHex(editorBgBase) },
    editorForeground: { hex: toHex(editorFg) },
    sidebarBackground: { hex: toHex(sidebarBg) },
    panelBackground: { hex: toHex(panelBg) },
    overlayBackground: { hex: toHex(overlayBg) },
    statusBarBackground: { hex: toHex(statusBarBg) },
    ...(statusBarBorderTop ? { statusBarBorderTop: { hex: toHex(statusBarBorderTop) } } : {}),
    focusBorder: { hex: toHex(uiAccent) },
    inputBackground: { hex: toHex(panelBg) },
    inputSunken: { hex: toHex(inputSunken) },
    divider: { hex: toHex(divider) },
    outline: { hex: toHex(surfaces.outline) },
    outlineVariant: { hex: toHex(surfaces.outlineVariant) },
    neutralBand: { hex: toHex(neutralBand) },
    cursorColor: { hex: toHex(cursorColor) },

    defaultForeground: { hex: toHex(editorFg) },
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

    terminalAnsiBlack: { hex: toHex(ansiBlack) },
    terminalAnsiRed: { hex: toHex(ansiRed) },
    terminalAnsiGreen: { hex: toHex(ansiGreen) },
    terminalAnsiYellow: { hex: toHex(ansiYellow) },
    terminalAnsiBlue: { hex: toHex(ansiBlue) },
    terminalAnsiMagenta: { hex: toHex(ansiMagenta) },
    terminalAnsiCyan: { hex: toHex(ansiCyan) },
    // ANSI white = main foreground (carries the same bg-hue whisper as editorFg).
    terminalAnsiWhite: { hex: toHex(editorFg) },

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

  const nameInfo = themeNames(paletteKind, paletteStyle)

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
      const nameInfo = themeNames(paletteKind, paletteStyle)
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
  const nameInfo = themeNames(paletteKind, paletteStyle)
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
  const nameInfo = themeNames(paletteKind, paletteStyle)
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
