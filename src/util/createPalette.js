import chroma from 'chroma-js'

const paletteVariations = [
  {
    refine: base => base,
  },
]

/**
 *
 * @param {string} target
 * @param {string[]} stops
 */
export function createPalette(color, stops) {
  const base = chroma(color)

  return paletteVariations.map(variation => {
    const refinedBase = variation.refine(base)
    return stops.map(stop => {})
  })
}
