import { DiceFourIcon } from '@phosphor-icons/react/dist/csr/DiceFour'
import { LifebuoyIcon } from '@phosphor-icons/react/dist/csr/Lifebuoy'
import Button from '../components/button/Button'
import './options.css'
import { pickRandomColor } from '../util/pickRandomColor'
import { LinearGradientSVG } from '../components/LinearGradientSVG'

export function Options({ setColor }: { setColor: React.Dispatch<React.SetStateAction<string>> }) {
  return (
    <div className="options-container">
      <Button
        handler={() => {
          const randomColor = pickRandomColor()
          setColor(randomColor)
        }}
        active={false}
      >
        <DiceFourIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </DiceFourIcon>
      </Button>
      <Button
        handler={() => {
          const windowFeatures = `width=500,height=800,resizable=false,scrollbars=yes,status=yes`

          window.open('/manual', '_blank', windowFeatures)
        }}
        active={false}
      >
        <LifebuoyIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </LifebuoyIcon>
      </Button>
    </div>
  )
}
