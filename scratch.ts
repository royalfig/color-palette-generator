import { generateAnalogous } from './src/util/analogous'
import { generateComplementary } from './src/util/complementary'

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
  const colors = generateAnalogous(testValue.color, { style: 'warm-cool' })
  return colors
})
console.log(JSON.stringify(p, null, 2))
