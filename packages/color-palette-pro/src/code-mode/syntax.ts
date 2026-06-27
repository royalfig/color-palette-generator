import Color from 'colorjs.io'
import type { SyntaxColors } from './types'
import {
  LOUD_ROLES,
  DISTINCT_ROLES_BY_FREQ,
  RED_SENSITIVE_ROLES,
  IDENTIFIER_ROLES,
  STRUCTURAL_ROLES,
  STRUCTURAL_C_MAX,
  COMMENT_C_MAX,
  APCA_TARGET_LOUD,
  APCA_TARGET_QUIET,
  APCA_COMMENT_MIN,
  APCA_COMMENT_MAX_DARK,
  APCA_COMMENT_MAX_LIGHT,
  READABILITY_BAND,
  HERO_ROLE,
  HERO_CHROMA_GAP,
  type ReadBand,
} from './constants'
import { hueGapDeg, ensureAPCAAgainst, capAPCAAgainst, clipToSRGB, deltaE, nudgeLightnessForDistinction } from './utils'

// The syntax-color pipeline (palette-primary). A template (templates/*.ts) maps the generated
// palette's swatches onto roles by geometry; this pipeline keeps the palette's hue *set* intact and
// never rotates a hue to a convention/exemplar. What it does: re-assign which swatch lands on which
// role to honour the two load-bearing conventions (string=green/warm, keyword=loud cool/hot), then
// make every role legible, distinct, and led by one chromatic peak:
//   0. conventionalize roles — permute loud colours so string/keyword aren't convention-violating
//   1. readability normalize — pull L into a mode band, clamp chroma; hue + relative chroma kept
//   2. comment hue           — keep comments ≥ 60° from strings (unless mono)
//   3. contrast floor        — APCA-lift every role against the real editor bg
//   4. distinction           — separate too-close roles by LIGHTNESS/chroma (never hue)
//   5. hero peak             — raise the keyword's chroma so one token clearly leads the eye
//   6. mono pin              — for the single-hue kind, snap every role back to the base hue
// buildSyntax() at the bottom runs the stages in order.

function isErrorRed(c: Color): boolean {
  return (c.oklch.c ?? 0) >= 0.1 && hueGapDeg(c.oklch.h ?? 0, 5) <= 20
}

// ----- convention-aware role assignment (palette-primary) -----
//
// The template maps palette swatches onto roles by GEOMETRY. But two cross-theme conventions are
// strong enough that violating them reads as "amateur" even when every colour is individually fine:
//   • strings are green or warm — a blue/violet string reads like a comment, a red one like an error;
//   • keywords are a loud cool/hot hue — never a muted earth-gold.
// This pass PERMUTES the loud colours among the loud roles to honour those two conventions while
// preserving the palette's hue *set* (no hue is invented or rotated — palette identity is intact).
// It only intervenes when the template's choice is actually violating, so a palette that already
// lands a green string / cool keyword is left untouched. Skipped for mono (one hue — nothing to
// permute). This is the convention layer the palette-primary redesign deliberately dropped, brought
// back as a swatch *reassignment* rather than a hue rewrite.

const ASSIGNABLE_LOUD = [
  'definitionColor',
  'keywordColor',
  'typeColor',
  'stringColor',
  'numberColor',
  'regexColor',
] as const

// Fitness is HUE-ONLY by design. Hue is the one swatch property that is style-invariant (style is
// material — it modulates chroma/L, never hue), and role→swatch is a hue decision, so scoring on
// chroma would make the *same* token land on different hues across square↔diamond. Loudness is not
// this pass's concern: the hero peak (applyHero) supplies keyword prominence via chroma downstream.

const norm = (h: number): number => ((h % 360) + 360) % 360

function stringFitness(c: Color): number {
  const h = norm(c.oklch.h ?? 0)
  // closeness to a string-friendly anchor: green (140) or warm-yellow (85)
  let score = -Math.min(hueGapDeg(h, 140), hueGapDeg(h, 85))
  if (hueGapDeg(h, 5) <= 22) score -= 200 // a red string reads as an error
  if (h >= 200 && h <= 320) score -= 70 // a cool/violet string reads wrong
  return score
}

function keywordFitness(c: Color): number {
  const h = norm(c.oklch.h ?? 0)
  if (h >= 45 && h <= 95) return -55 // a muted earth-gold keyword is the classic "off" note
  if (h >= 268 && h < 330) return 40 // violet/purple — the canonical keyword
  if (h >= 330 || h <= 20) return 30 // red / pink / magenta
  if (h >= 210 && h < 268) return 25 // blue
  if (h > 95 && h < 160) return 15 // green — acceptable
  if (h >= 160 && h < 210) return 8 // cyan / teal — weak
  return 0 // orange (21–44) — neutral
}

function isViolatingString(c: Color): boolean {
  const h = norm(c.oklch.h ?? 0)
  return hueGapDeg(h, 5) <= 22 || (h >= 200 && h <= 320)
}
function isEarthyKeyword(c: Color): boolean {
  const h = c.oklch.h ?? 0
  return h >= 45 && h <= 95
}

function conventionalizeRoles(syntax: SyntaxColors, isMono: boolean): SyntaxColors {
  if (isMono) return syntax
  const out = { ...syntax }
  const colors = ASSIGNABLE_LOUD.map(r => (out as any)[r] as Color)
  const SI = ASSIGNABLE_LOUD.indexOf('stringColor')
  const KI = ASSIGNABLE_LOUD.indexOf('keywordColor')
  const swap = (i: number, j: number): void => {
    const t = colors[i]
    colors[i] = colors[j]
    colors[j] = t
  }

  // Tie margin: only override an earlier candidate when it's better by more than this. Two swatches
  // of the same family score within float noise of each other, and that noise drifts sub-degree
  // across styles (style adjusts chroma, which nudges hue ~1e-4°) — without a margin the winner of a
  // tie would flip square↔diamond and the *same* token would change hue across styles. The margin
  // makes near-ties resolve to the lowest index (the template's own order) deterministically.
  const TIE = 2

  // 1. string → greenest/warmest available, but only when the template's string is violating.
  if (isViolatingString(colors[SI])) {
    let best = SI
    let bestScore = stringFitness(colors[SI])
    for (let i = 0; i < colors.length; i++) {
      const s = stringFitness(colors[i])
      if (s > bestScore + TIE) {
        bestScore = s
        best = i
      }
    }
    if (best !== SI) swap(SI, best)
  }

  // 2. keyword → best cool/hot hue available (never the slot just given to string). Swap when the
  //    template's keyword is earthy, or a clearly better hue exists.
  {
    let best = KI
    let bestScore = keywordFitness(colors[KI])
    for (let i = 0; i < colors.length; i++) {
      if (i === SI) continue
      const s = keywordFitness(colors[i])
      if (s > bestScore + TIE) {
        bestScore = s
        best = i
      }
    }
    if (best !== KI && (isEarthyKeyword(colors[KI]) || bestScore > keywordFitness(colors[KI]) + TIE)) {
      swap(KI, best)
    }
  }

  ASSIGNABLE_LOUD.forEach((r, i) => {
    ;(out as any)[r] = colors[i]
  })
  return out
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
    if (RED_SENSITIVE_ROLES.has(k) && isErrorRed(c))
      c.oklch.h = 30
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
          ;(out as any)[roles[j]] = finalize(nudgeLightnessForDistinction(b, a, isDarkMode))
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
          const others = roles.filter(r => r !== roles[j]).map(r => (out as any)[r] as Color)
          const minDE = (c: Color): number => Math.min(...others.map(o => deltaE(c, o)))
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
 * Hero peak: guarantee one loud role leads the eye. The keyword (HERO_ROLE) is raised in chroma to
 * clear the rest of the loud field by HERO_CHROMA_GAP, capped at the band ceiling. Runs *last* (after
 * distinction) so the final field is the reference and the peak is never re-flattened: it only adds
 * chroma, which moves the hero *away* from its neighbours in ΔE, so it can't reintroduce a collision.
 * L is untouched, so the APCA floor still holds.
 */
function applyHero(syntax: SyntaxColors, band: ReadBand): SyntaxColors {
  const out = { ...syntax }
  const hero = ((syntax as any)[HERO_ROLE] as Color).clone()
  let maxOther = 0
  for (const k of LOUD_ROLES) {
    if (k === HERO_ROLE) continue
    maxOther = Math.max(maxOther, ((syntax as any)[k] as Color).oklch.c ?? 0)
  }
  const target = Math.min(band.loud.cCeil, Math.max(hero.oklch.c ?? 0, maxOther + HERO_CHROMA_GAP))
  hero.oklch.c = target
  ;(out as any)[HERO_ROLE] = clipToSRGB(hero)
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
 *   0. conventionalize roles  — permute loud swatches so string is green/warm and keyword is a loud
 *                               cool/hot hue (hue set preserved; skipped for mono)
 *   1. readability normalize  — L into the mode band, chroma clamped (hue preserved)
 *   2. comment hue            — keep comments ≥ 60° from strings (unless mono)
 *   3. contrast floor         — APCA-lift every role against the real bg
 *   4. distinction            — separate too-close roles by L/chroma (contrast lifts compress L, so
 *                               this runs after); mono packs tighter since L is its only axis
 *   5. hero peak              — raise the keyword's chroma a clear step above the loud field
 *   6. mono pin               — for the single-hue kind, snap every role back to the base hue
 */
export function buildSyntax(raw: SyntaxColors, ctx: SyntaxBuildContext): SyntaxColors {
  const { bg, isDarkMode, isMono } = ctx
  const band = isDarkMode ? READABILITY_BAND.dark : READABILITY_BAND.light

  const assigned = conventionalizeRoles(raw, isMono)
  const banded = normalizeForReadability(assigned, band)
  const commented = adjustCommentHue(banded, bg, isMono)
  const contrasted = ensureRoleContrast(commented, bg, isDarkMode)

  const minDeltaE = isMono ? (isDarkMode ? 4.5 : 6) : isDarkMode ? 6 : 8
  const distinct = enforceDistinction(contrasted, bg, isDarkMode, minDeltaE, band.loud.cCeil)

  const heroed = applyHero(distinct, band)
  return isMono ? enforceMonoHue(heroed, ctx.monoHue) : heroed
}
