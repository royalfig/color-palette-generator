import { generateMaterialUI, generateUiColorPalette } from './src/util/ui'
import Color from 'colorjs.io'

function testMaterialUIGeneration() {
  console.log('=== Testing Material UI Palette Generation ===')
  
  // Test with a vibrant blue color
  const testColor = '#2196F3'
  console.log('Base color:', testColor)
  
  // Test the export function
  const result = generateMaterialUI(testColor, { style: 'square' })
  
  console.log('\nLight Mode Palette:')
  Object.entries(result.light).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  
  console.log('\nDark Mode Palette:')
  Object.entries(result.dark).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  
  // Test monochrome (TAS) palette
  console.log('\n=== Testing Monochrome TAS Palette ===')
  const baseColor = new Color(testColor)
  const mockPalette = [
    { color: baseColor } as any,
    { color: baseColor.clone() } as any,
    { color: baseColor.clone() } as any,
  ]
  
  const monochromeLight = generateUiColorPalette(baseColor, mockPalette, false, 'tas')
  const monochromeDark = generateUiColorPalette(baseColor, mockPalette, true, 'tas')
  
  console.log('\nMonochrome Light:')
  console.log('Primary:', monochromeLight.primary.toString())
  console.log('Secondary:', monochromeLight.secondary.toString())
  console.log('Tertiary:', monochromeLight.tertiary.toString())
  console.log('Surface:', monochromeLight.surface.toString())
  
  console.log('\nMonochrome Dark:')
  console.log('Primary:', monochromeDark.primary.toString())
  console.log('Secondary:', monochromeDark.secondary.toString())
  console.log('Tertiary:', monochromeDark.tertiary.toString())
  console.log('Surface:', monochromeDark.surface.toString())
}

testMaterialUIGeneration()