import Color from 'colorjs.io'
import type { SyntaxColors } from './types'
import {
  LOUD_ROLES, DISTINCT_ROLES_BY_FREQ, RED_SENSITIVE_ROLES,
  IDENTIFIER_ROLES, STRUCTURAL_ROLES, STRUCTURAL_C_MAX, COMMENT_C_MAX,
  APCA_TARGET_LOUD, APCA_TARGET_QUIET, APCA_COMMENT_MIN, APCA_COMMENT_MAX_DARK, APCA_COMMENT_MAX_LIGHT,
  READABILITY_BAND, type ReadBand,
} from './constants'
import {
  hueGapDeg, ensureAPCAAgainst, capAPCAAgainst, clipToSRGB, deltaE,
  nudgeLightnessForDistinction,
} from './utils'

// The syntax-color pipeline (palette-primary). A template (templates/*.ts) has already mapped the
// generated palette's swatches onto roles — that assignment IS the theme's identity, so this
// pipeline never re-permutes roles or rewrites hues to match a convention or an exemplar theme.
// All it does is make the template's colors *legible and distinct* while preserving their hue:
//   1. readability normalize — pull L into a mode band, clamp chroma; hue + relative chroma kept
//   2. comment hue           — keep comments ≥ 60° from strings (unless mono)
//   3. contrast floor        — APCA-lift every role against the real editor bg
//   4. distinction           — separate too-close roles by LIGHTNESS/chroma (never hue)
//   5. mono pin              — for the single-hue kind, snap every role back to the base hue
// buildSyntax() at the bottom runs the stages in order.

function isErrorRed(c: Color): boolean {
  return (c.oklch.c ?? 0) >= 0.10 && hueGapDeg(c.oklch.h ?? 0, 5) <= 20
}

/**
 * Palette-preserving normalize. The template's per-role colors keep their hue and their relative
 * chroma; only L is clamped into the mode's readable band and chroma into sane floor/ceiling
 * bounds. No exemplar L/C envelope and no accent-peak forcing — the palette's own contrast (its
 * lightness spread and which swatch the template boosted) is what makes one role read as the
 * accent. The single exception is the red-as-error guard, a legibility floor, not a restyle.
 */
function normalizeForReadability(syntax: SyntaxColors, band: ReadBand): SyntaxColors {
  const out = { ...syntax }
  const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

  for (const k of LOUD_ROLES) {
    const c = ((syntax as any)[k] as Color).clone()
    c.oklch.l = clamp(c.oklch.l ?? 0.5, band.loud.lLo, band.loud.lHi)
    c.oklch.c = clamp(c.oklch.c ?? 0, band.loud.cFloor, band.loud.cCeil)
    // Saturated error-red on a role that must not read as an error (string/function/number):
    // shift to orange — keeps the warmth, sheds the error read. Pastel reds pass through.
    if (RED_SENSITIVE_ROLES.has(k) && isErrorRed(c)) c.oklch.h = 30
    // Clip to gamut now: downstream distinction must see what will actually render.
    ;(out as any)[k] = clipToSRGB(c)
  }

  for (const k of IDENTIFIER_ROLES) {
    const c = ((syntax as any)[k] as Color).clone()
    c.oklch.l = clamp(c.oklch.l ?? 0.7, band.quiet.lLo, band.quiet.lHi)
    // Identifiers keep a real but quiet tint (the template ties them to the base hue) — floor and
    // cap so they neither collapse to gray nor compete with the loud tokens.
    c.oklch.c = clamp(c.oklch.c ?? 0, band.quiet.cFloor, band.quiet.cCeil)
    ;(out as any)[k] = c
  }
  for (const k of STRUCTURAL_ROLES) {
    const c = ((syntax as any)[k] as Color).clone()
    c.oklch.l = clamp(c.oklch.l ?? 0.7, band.quiet.lLo - 0.04, band.quiet.lHi + 0.04)
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
 * True-monochrome guard: snap every syntax role's hue to the base hue and re-clip to gamut
 * (preserving the now-correct hue). Roles are separated by lightness and chroma, so this never
 * collapses them — it only removes the small hue drift the contrast/gamut passes can introduce
 * (e.g. a high-L type gamut-twisting off-hue). Achromatic seeds are left untouched.
 */
function enforceMonoHue(syntax: SyntaxColors, baseHue: number): SyntaxColors {
  if (!Number.isFinite(baseHue)) return syntax
  const out = { ...syntax }
  const keys = [...LOUD_ROLES, ...IDENTIFIER_ROLES, ...STRUCTURAL_ROLES, 'commentColor'] as const
  for (const k of keys) {
    const c = ((syntax as any)[k] as Color).clone()
    c.oklch.h = baseHue
    ;(out as any)[k] = clipToSRGB(c)
  }
  return out
}

/**
 * Comment hue rule: comments read best either tinted with the bg's own hue or sent green, and in
 * nearly every theme they sit ≥ 60° from the string hue so comments never read as strings. If the
 * template left the comment too close to the string family, re-aim it at whichever candidate hue
 * lands farthest from strings. Monochrome keeps its comment on the base hue (recessed by L, not
 * separated by hue).
 */
function adjustCommentHue(syntax: SyntaxColors, bg: Color, monoIdentity = false): SyntaxColors {
  if (monoIdentity) return syntax
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
 * Frequency-weighted distinction, palette-primary. Iterate DISTINCT_ROLES in descending
 * token-frequency order; high-frequency roles "anchor" and lower-frequency roles step around
 * them. Separation is ALWAYS by lightness/chroma, never by rotating hue — so an analogous palette
 * stays analogous (its roles tier by L like Nord) and a polychrome palette keeps its swatch hues.
 *
 * Runs *after* the APCA floor pass: contrast lifts compress lightness differences and would
 * re-collide separated pairs, so every nudged candidate is re-floored against the editor bg inside
 * the loop and the convergence check always sees final values.
 */
function enforceDistinction(
  syntax: SyntaxColors,
  bg: Color,
  isDarkMode: boolean,
  minDeltaE: number,
  maxChroma: number,
): SyntaxColors {
  const out = { ...syntax }
  const roles = DISTINCT_ROLES_BY_FREQ
  // Cap every nudged result at the readable chroma ceiling so separation happens along L
  // rather than by inflating chroma, and re-floor for legibility.
  const finalize = (c: Color): Color => {
    const cl = c.clone()
    cl.oklch.c = Math.min(cl.oklch.c ?? 0, maxChroma)
    return ensureAPCAAgainst(clipToSRGB(cl), bg, APCA_TARGET_LOUD)
  }

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const a = (out as any)[roles[i]] as Color
        const b = (out as any)[roles[j]] as Color
        if (deltaE(a, b) < minDeltaE) {
          (out as any)[roles[j]] = finalize(nudgeLightnessForDistinction(b, a, isDarkMode))
        }
      }
    }
  }
  // Fallback passes: a role wedged between two neighbors can oscillate (resolving one pair pushes
  // it onto another — musical chairs). Step L and chroma, evaluating candidates against *all* other
  // distinct roles so a nudge never lands on a third color, and escalate the stride each pass.
  const [lMin, lMax] = isDarkMode ? [0.62, 0.93] : [0.34, 0.66]
  const candidateAt = (b: Color, l: number, cDelta = 0.01): Color => {
    const c = b.clone()
    c.oklch.l = l
    c.oklch.c = Math.max(0.04, Math.min(maxChroma, (c.oklch.c ?? 0) + cDelta))
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

/** Inputs the pipeline needs beyond the raw template colors. */
export interface SyntaxBuildContext {
  /** The actual editor background, for every contrast/distinction pass. */
  bg: Color
  isDarkMode: boolean
  /** Single-hue kind (tints & shades): separate by L only, then pin every role to the base hue. */
  isMono: boolean
  /** Base hue, used to re-pin mono themes to a single hue at the end. */
  monoHue: number
}

/**
 * Run the template's palette-derived colors through the legibility pipeline:
 *   1. readability normalize — L into the mode band, chroma clamped (hue preserved)
 *   2. comment hue            — keep comments ≥ 60° from strings (unless mono)
 *   3. contrast floor         — APCA-lift every role against the real bg
 *   4. distinction            — separate too-close roles by L/chroma (contrast lifts compress L, so
 *                               this runs after); mono packs tighter since L is its only axis
 *   5. mono pin               — for the single-hue kind, snap every role back to the base hue
 */
export function buildSyntax(raw: SyntaxColors, ctx: SyntaxBuildContext): SyntaxColors {
  const { bg, isDarkMode, isMono } = ctx
  const band = isDarkMode ? READABILITY_BAND.dark : READABILITY_BAND.light

  const banded = normalizeForReadability(raw, band)
  const commented = adjustCommentHue(banded, bg, isMono)
  const contrasted = ensureRoleContrast(commented, bg, isDarkMode)

  const minDeltaE = isMono ? (isDarkMode ? 4.5 : 6) : isDarkMode ? 6 : 8
  const distinct = enforceDistinction(contrasted, bg, isDarkMode, minDeltaE, band.loud.cCeil)

  return isMono ? enforceMonoHue(distinct, ctx.monoHue) : distinct
}
