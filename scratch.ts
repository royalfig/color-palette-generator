import { generateAnalogous } from './src/util/analogous'
import { generateComplementary } from './src/util/complementary'
import { generateSplitComplementary } from './src/util/splitcomp'
import { generateTetradic } from './src/util/tetradic'
import { generateTintsAndShades } from './src/util/tints-and-shades'
import { generateTones } from './src/util/tones'
import { generateTriadic } from './src/util/triadic'
import { generateMaterialUI } from './src/util/ui'

const testValues = [
  //   {
  //     color: 'oklch(0.628 0.259 30.18)',
  //     space: 'lch',
  //   },
  //   {
  //     color: 'hsl(225 100% 50%)',
  //     space: 'hsl',
  //   },
  {
    color: '#ff0000',
    space: 'hex',
  },
  //   {
  //     color: 'oklab(90% -0.243 0.272)',
  //     space: 'oklab',
  //   },
  //   {
  //     color: 'hsl(50 80% 40%)',
  //     space: 'hsl',
  //   },
  //   {
  //     color: 'hsl(150deg 30% 60%)',
  //     space: 'hsl',
  //   },
  //   {
  //     color: '#fff',
  //   },
  //   { color: '#FFE0E0' },
]

const p = testValues.map(testValue => {
  const style = 'warm-cool'
  return {
    analogous: generateAnalogous(testValue.color, { style }),
    complementary: generateComplementary(testValue.color, { style }),
    triadic: generateTriadic(testValue.color, { style }),
    tetradic: generateTetradic(testValue.color, { style }),
    splitComplementary: generateSplitComplementary(testValue.color, { style }),
    tintsAndShades: generateTintsAndShades(testValue.color, { style }),
    tones: generateTones(testValue.color, { style }),
    materialUI: generateMaterialUI(testValue.color, { style }),
  }
})
console.log(JSON.stringify(p, null, 2))
