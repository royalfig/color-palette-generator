import Color from 'colorjs.io'
import type { ModeBands, PaletteCharacter, SyntaxAccentRole, SyntaxColors } from './types'
import {
  LOUD_ROLES, DISTINCT_ROLES_BY_FREQ, ROLE_HUE_ANCHORS, RED_SENSITIVE_ROLES,
  IDENTIFIER_ROLES, STRUCTURAL_ROLES, STRUCTURAL_C_MAX, COMMENT_C_MAX,
  APCA_TARGET_LOUD, APCA_TARGET_QUIET, APCA_COMMENT_MIN, APCA_COMMENT_MAX_DARK, APCA_COMMENT_MAX_LIGHT,
} from './constants'
import {
  hueGapDeg, ensureAPCAAgainst, capAPCAAgainst, clipToSRGB, deltaE,
  nudgeForDistinction, nudgeLightnessForDistinction,
} from './utils'

// The syntax-color pipeline. A template's raw per-role colors (templates/*.ts) are pushed
// through a fixed sequence of transforms so the result lands in the kind's measured token
// band, honors hue conventions, clears perceptual contrast, and keeps roles visually
// distinct. buildSyntax() at the bottom runs the stages in their load-bearing order.

function isErrorRed(c: Color): boolean {
  return (c.oklch.c ?? 0) >= 0.10 && hueGapDeg(c.oklch.h ?? 0, 5) <= 20
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
 * True-monochrome guard: snap every syntax role's hue to the base hue and re-clip to gamut
 * (preserving the now-correct hue). Roles are separated by lightness and chroma, so this never
 * collapses them — it only removes the small hue drift the contrast/gamut passes can introduce
 * (e.g. a high-L blue type gamut-twisting off-hue). Achromatic seeds are left untouched.
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
 * Comment hue rule from the corpus: comments are either tinted with the bg's own hue
 * (Nord, One Dark, Dracula, Tokyo Night — Δhue vs bg ≤ 13°) or go green (the VS Code /
 * Vitesse school) — and in nearly every theme they sit ≥ 90° from the string hue so
 * comments never read as strings. If the template left the comment too close to the
 * string family, re-aim it at whichever candidate hue lands farthest from strings.
 */
function adjustCommentHue(syntax: SyntaxColors, bg: Color, monoIdentity = false): SyntaxColors {
  // Monochrome keeps its comment on the base hue — re-aiming it would break the single-hue
  // identity. (The mono comment is recessed by lightness, not separated by hue.)
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
  maxChroma = 0.2,
): SyntaxColors {
  const out = { ...syntax }
  const roles = DISTINCT_ROLES_BY_FREQ
  const nudge = monoIdentity ? nudgeLightnessForDistinction : nudgeForDistinction
  // Cap every nudged result at the kind's loud chroma ceiling so separation happens along L
  // and hue rather than by inflating chroma past the band — otherwise a cramped palette (Nord
  // analogous) drifts as saturated as the neon kinds and loses its muted identity.
  const finalize = (c: Color): Color => {
    const cl = c.clone()
    cl.oklch.c = Math.min(cl.oklch.c ?? 0, maxChroma)
    return ensureAPCAAgainst(clipToSRGB(cl), bg, APCA_TARGET_LOUD)
  }

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

/** Inputs the pipeline needs beyond the raw template colors. */
export interface SyntaxBuildContext {
  /** The actual editor background, for every contrast/distinction pass. */
  bg: Color
  isDarkMode: boolean
  /** Per-mode token bands from the kind's personality. */
  bands: { dark: ModeBands; light: ModeBands }
  /** Loud roles that carry the kind's chroma peak. */
  accentRoles: SyntaxAccentRole[]
  /** Kind character — gates mono handling and the distinction pressure. */
  character: PaletteCharacter
  /** Base hue, used to re-pin mono themes to a single hue at the end. */
  monoHue: number
}

/**
 * Run the raw template colors through the pipeline in load-bearing order:
 *   1. hue conventions  — place green=string, purple=keyword, … before bands assign chroma
 *   2. band normalize   — remap loud L/C into the kind's measured envelope
 *   3. comment hue       — keep comments ≥ 60° from strings (unless mono)
 *   4. contrast floor    — APCA-lift every role against the real bg
 *   5. distinction       — separate roles (contrast lifts compress L, so this runs after)
 *   6. identifier family — link variables/properties to the cool loud family
 *   7. mono pin          — for mono kinds, snap every role back to the base hue
 * Separation pressure is character-aware: serene/mono kinds pack tighter so over-separating
 * doesn't inflate chroma past the band and erase the muted identity.
 */
export function buildSyntax(raw: SyntaxColors, ctx: SyntaxBuildContext): SyntaxColors {
  const { bg, isDarkMode, accentRoles, character } = ctx
  const isMono = character === 'mono'
  const modeBands = isDarkMode ? ctx.bands.dark : ctx.bands.light

  const conventional = applyHueConventions(raw)
  const banded = normalizeToBands(conventional, modeBands, accentRoles, isDarkMode)
  const commented = adjustCommentHue(banded, bg, isMono)
  const contrasted = ensureRoleContrast(commented, bg, isDarkMode)

  const minDeltaE = isMono
    ? (isDarkMode ? 4.5 : 6)
    : character === 'serene'
      ? (isDarkMode ? 6 : 8)
      // Light themes keep their roles further apart (corpus p10: 8.0 dark, 10.7 light).
      : (isDarkMode ? 8 : 10)
  const distinct = enforceDistinction(contrasted, bg, isDarkMode, isMono, minDeltaE, modeBands.loud.cHi)

  let syntax = linkIdentifierFamily(distinct, bg)
  if (isMono) syntax = enforceMonoHue(syntax, ctx.monoHue)
  return syntax
}
