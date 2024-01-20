import { colorFactory } from './factory'
import Color from 'colorjs.io'

export function createScales(baseColor: Color | string) {
  const tonesStartOriginal = new Color(baseColor).mix('#808080', 0.9, { space: 'hsl', outputSpace: 'hsl' })
  const lightenedTonesStartOriginal = new Color(tonesStartOriginal)
  lightenedTonesStartOriginal.hsl.l = 99
  const tonesEndOriginal = new Color(baseColor).mix('#808080', 0.9, { space: 'hsl', outputSpace: 'hsl' })
  const lightenedTonesEndOriginal = new Color(tonesEndOriginal)
  lightenedTonesEndOriginal.hsl.l = 1
  const tonesOriginal = Color.steps(lightenedTonesStartOriginal, lightenedTonesEndOriginal, {
    space: 'hsl',
    steps: 10,
  })

  const tonesStartKeel = new Color(baseColor).mix('#808080', 0.9, { space: 'lch', outputSpace: 'lch' })
  const tonesSk = new Color(tonesStartKeel)
  tonesSk.lch.l = 99
  const tonesEndKeel = new Color(baseColor).mix('#808080', 0.9, { space: 'lch', outputSpace: 'lch' })
  const tonesEk = new Color(tonesEndKeel)
  tonesEk.lch.l = 1
  const tonesKeel = Color.steps(tonesSk, tonesEk, { space: 'lch', outputSpace: 'lch', steps: 10 })

  const tonesStartCinematic = new Color(baseColor).mix('#808080', 0.75, { space: 'lch', outputSpace: 'lch' })
  const tSc = new Color(tonesStartCinematic)
  tSc.lch.l = 99
  tSc.lch.c *= 0.5
  const tonesEndCinematic = new Color(baseColor).mix('#808080', 0.75, { space: 'lch', outputSpace: 'lch' })
  const tEc = new Color(tonesEndCinematic)
  tEc.lch.l = 1
  tEc.lch.c *= 1.5

  const tonesCinematic = Color.steps(tSc, tEc, {
    space: 'oklab',
    outputSpace: 'oklab',
    steps: 10,
  })

  const tonesStartLanguid = new Color(baseColor).mix('#808080', 0.98, { space: 'hsl', outputSpace: 'hsl' })
  const tSl = new Color(tonesStartLanguid)
  tSl.hsl.l = 99
  tSl.hsl.s *= 0.5

  const tonesEndLanguid = new Color(baseColor).mix('#808080', 0.98, { space: 'hsl', outputSpace: 'hsl' })
  const tEl = new Color(tonesEndLanguid)
  tEl.hsl.l = 1
  tEl.hsl.s *= 0.5

  const tonesLanguid = Color.steps(tSl, tEl, {
    space: 'lch',
    outputSpace: 'lch',
    steps: 10,
    hue: 'shorter',
  })

  const sbStartLanguid = new Color(baseColor).mix('#808080', 0.98, { space: 'lch', outputSpace: 'lch' })
  const tSbs = new Color(sbStartLanguid)
  tSbs.lch.l = 99
  tSbs.lch.c *= 1.5

  const sbEndLanguid = new Color(baseColor).mix('#808080', 0.98, { space: 'lch', outputSpace: 'lch' })
  const tSbe = new Color(sbEndLanguid)
  tSbe.lch.l = 1
  tSbe.lch.c *= 1.5

  const tonesSharkbite = Color.steps(tSbs, tSbe, {
    space: 'lch',
    outputSpace: 'oklab',
    steps: 10,
  })

  const tones = {
    original: tonesOriginal.map((c, idx) => colorFactory(c, 'tones-o', idx)),
    keel: tonesKeel.map((c, idx) => colorFactory(c, 'tones-k', idx)),
    cinematic: tonesCinematic.map((c, idx) => colorFactory(c, 'tones-c', idx)),
    languid: tonesLanguid.map((c, idx) => colorFactory(c, 'tones-l', idx)),
    sharkbite: tonesSharkbite.map((c, idx) => colorFactory(c, 'tones-s', idx)),
  }

  const polyStartOriginal = new Color(baseColor)
  const polyEndOriginal = new Color(baseColor)
  polyEndOriginal.hsl.h += 359
  polyEndOriginal.hsl.h = polyEndOriginal.hsl.h % 360
  const polyOriginal = Color.steps(polyStartOriginal, polyEndOriginal, {
    space: 'hsl',
    steps: 10,
    hue: 'increasing',
  })
  const polyKeel = Color.steps(polyStartOriginal, polyEndOriginal, {
    space: 'oklch',
    outputSpace: 'oklch',
    steps: 10,
    hue: 'increasing',
  })
  const polyCinematic = Color.steps(polyStartOriginal, polyEndOriginal, {
    space: 'oklab',
    outputSpace: 'oklab',
    steps: 10,
    hue: 'shorter',
  })
  const polyLanguid = Color.steps(polyStartOriginal, polyEndOriginal, {
    space: 'oklch',
    outputSpace: 'oklch',
    steps: 10,
    hue: 'shorter',
  })
  const polySharkbite = Color.steps(polyStartOriginal, polyEndOriginal, {
    space: 'srgb',
    outputSpace: 'srgb',
    steps: 10,
    hue: 'longer',
  })
  const poly = {
    original: polyOriginal.map((c, idx) => colorFactory(c, 'poly-o', idx)),
    keel: polyKeel.map((c, idx) => colorFactory(c, 'poly-k', idx)),
    cinematic: polyCinematic.map((c, idx) => colorFactory(c, 'poly-c', idx)),
    languid: polyLanguid.map((c, idx) => colorFactory(c, 'poly-l', idx)),
    sharkbite: polySharkbite.map((c, idx) => colorFactory(c, 'poly-s', idx)),
  }

  const tintsStartDesaturated = new Color(baseColor).mix('white', 0.9, { space: 'srgb', outputSpace: 'srgb' })
  const tintsStartOriginal = new Color(tintsStartDesaturated)
  const tintsEndDesaturated = new Color(baseColor).mix('black', 0.9, { space: 'srgb', outputSpace: 'srgb' })
  const tintsEndOriginal = new Color(tintsEndDesaturated)
  const tintsOriginal = Color.steps(tintsStartOriginal, tintsEndOriginal, {
    space: 'hsl',
    outputSpace: 'hsl',
    steps: 10,
  })

  const tintsCinematic = Color.steps(tintsStartOriginal, tintsEndOriginal, {
    space: 'oklab',
    outputSpace: 'oklab',
    steps: 10,
  })

  const tintsStartKeel = new Color(baseColor).mix('#fff', 0.95, { space: 'lch', outputSpace: 'lch' })
  const tintsEndKeel = new Color(baseColor).mix('#000', 0.95, { space: 'lch', outputSpace: 'lch' })
  const tintsKeel = Color.steps(tintsStartKeel, tintsEndKeel, {
    space: 'lch',
    outputSpace: 'lch',
    steps: 10,
  })

  const tints = {
    original: tintsOriginal.map((c, idx) => colorFactory(c, 'tints-original', idx)),
    keel: tintsKeel.map((c, idx) => colorFactory(c, 'tints-keel', idx)),
    cinematic: tintsCinematic.map((c, idx) => colorFactory(c, 'tints-cinematic', idx)),
    languid: tintsOriginal.map((c, idx) => colorFactory(c, 'tints-languid', idx)),
    sharkbite: tintsOriginal.map((c, idx) => colorFactory(c, 'tints-sharkbite', idx)),
  }

  return { tones: tones, poly: poly, tints: tints }
}
