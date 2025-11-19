import type { Dispatch, SetStateAction } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { ColorSpaceAndFormat } from '../../types'
import { Slider } from './Slider'
import './slider.css'

/* types. hue for hsl, lch, oklch
lightness for hsl, lch, oklch, lab, oklab
saturation.chroma for lch, oklch, lab, oklab

hex/srgb
r 
g
b

a lab green/red
b blue/yellow
*/

function renderSliders(colorSpace: ColorSpaceAndFormat, setColor: Dispatch<SetStateAction<string>>) {
  switch (colorSpace.space) {
    case 'hsl':
      return (
        <>
          <Slider colorSpace={colorSpace} type="hue" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="saturation" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="lightness" setColor={setColor} />
        </>
      )
    case 'srgb':
      return (
        <>
          <Slider colorSpace={colorSpace} type="r" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="g" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="b" setColor={setColor} />
        </>
      )
    case 'p3':
      return (
        <>
          <Slider colorSpace={colorSpace} type="p3-r" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="p3-g" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="p3-b" setColor={setColor} />
        </>
      )
    case 'lab':
      return (
        <>
          <Slider colorSpace={colorSpace} type="lightness" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="lab-a" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="lab-b" setColor={setColor} />
        </>
      )
    case 'oklab':
      return (
        <>
          <Slider colorSpace={colorSpace} type="lightness" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="oklab-a" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="oklab-b" setColor={setColor} />
        </>
      )
    case 'lch':
    case 'oklch':
      return (
        <>
          <Slider colorSpace={colorSpace} type="lightness" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="saturation" setColor={setColor} />
          <Slider colorSpace={colorSpace} type="hue" setColor={setColor} />
        </>
      )
  }
}

export function SliderGroup({
  colorSpace,
  setColor,
}: {
  colorSpace: ColorSpaceAndFormat
  setColor: Dispatch<SetStateAction<string>>
}) {
  const shouldReduceMotion = useReducedMotion()
  
  // Memoize transition config to avoid recreating object on every render
  // This prevents unnecessary re-renders of motion.div
  const transition = useMemo(
    () => ({
      duration: shouldReduceMotion ? 0 : 0.2,
      ease: 'easeIn' as const,
    }),
    [shouldReduceMotion],
  )

  // Memoize sliders to avoid recreating on every render
  // Only recreate when colorSpace.space changes (setColor is stable)
  const sliders = useMemo(
    () => renderSliders(colorSpace, setColor),
    [colorSpace.space, colorSpace.format, setColor],
  )

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={colorSpace.space}
        initial={shouldReduceMotion ? false : { clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0 0 0)' }}
        exit={shouldReduceMotion ? false : { clipPath: 'inset(0 0 0 100%)' }}
        transition={transition}
        className="slider-group"
      >
        {sliders}
      </motion.div>
    </AnimatePresence>
  )
}
