import type { Dispatch, SetStateAction } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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

export function SliderGroup({
  colorSpace,
  setColor,
}: {
  colorSpace: ColorSpaceAndFormat
  setColor: Dispatch<SetStateAction<string>>
}) {
  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={colorSpace.space}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0 0 0)' }}
        exit={{ clipPath: 'inset(0 0 0 100%)' }}
        transition={{ duration: 0.2, ease: 'easeIn' }}
        className="slider-group"
      >
        {(() => {
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
        })()}
      </motion.div>
    </AnimatePresence>
  )
}
