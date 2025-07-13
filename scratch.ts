import { generateComplementary } from './src/util/complementary'
import { generateUiColorPalette } from './src/util/ui'
import Color from 'colorjs.io'
const comp = generateComplementary('oklch(74.5% 0.39 151)', {
  style: 'square',
  colorSpace: { space: 'oklch', format: 'oklch' },
})

function testMaterialUIGeneration() {
  const res = generateUiColorPalette(comp[0].color.clone(), comp, true, 'com')
  console.log(
    res.map(c => {
      return {
        [c.code]: c.cssValue,
      }
    }),
  )
}

testMaterialUIGeneration()
