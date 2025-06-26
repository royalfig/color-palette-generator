import { ShuffleIcon } from '@phosphor-icons/react/dist/csr/Shuffle'
import { QuestionIcon } from '@phosphor-icons/react/dist/csr/Question'
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
        <ShuffleIcon size={22} color="url(#shuffle-gradient)" weight="fill">
          <LinearGradientSVG id="shuffle-gradient" />
        </ShuffleIcon>
      </Button>
      <Button
        handler={() => {
          const windowFeatures = `width=500,height=800,resizable=false,scrollbars=yes,status=yes`

          window.open('/manual', '_blank', windowFeatures)
        }}
        active={false}
      >
        <QuestionIcon size={22} color="url(#question-gradient)" weight="fill">
          <LinearGradientSVG id="question-gradient" />
        </QuestionIcon>
      </Button>
    </div>
  )
}
