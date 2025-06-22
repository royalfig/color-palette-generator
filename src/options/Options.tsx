import { DiceFourIcon } from '@phosphor-icons/react/dist/ssr'
import Button from '../components/button/Button'
import { LifebuoyIcon } from '@phosphor-icons/react'
import { container } from './options.module.css'
import { pickRandomColor } from '../util/pickRandomColor'
import { Dispatch } from 'react'

export function Options({ setColor }: { setColor: React.Dispatch<React.SetStateAction<string>> }) {
  return (
    <div className={container}>
      <Button
        handler={() => {
          const randomColor = pickRandomColor()
          setColor(randomColor)
        }}
        active={false}
      >
        <DiceFourIcon weight="fill" size={24} />
      </Button>
      <Button handler={() => {}} active={false}>
        <LifebuoyIcon weight="fill" size={24} />
      </Button>
    </div>
  )
}
