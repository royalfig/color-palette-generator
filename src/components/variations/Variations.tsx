import { AdjustmentsHorizontalIcon, ScaleIcon, FilmIcon, CloudIcon, FireIcon } from '@heroicons/react/24/outline'
import Button from '../button/Button'
import './variationSelector.css'

export function VariationSelector({ variation, setVariation }: { variation: string; setVariation: Function }) {
  return (
    <div className="variation-selector-container">
      <Button
        handler={() => setVariation('original')}
        active={variation === 'original'}
        aria-label="Set variation to original"
      >
        <AdjustmentsHorizontalIcon />
      </Button>
      <Button handler={() => setVariation('keel')} active={variation === 'keel'} aria-label="Set variation to keel">
        <ScaleIcon />
      </Button>
      <Button
        handler={() => setVariation('cinematic')}
        active={variation === 'cinematic'}
        aria-label="Set variation to cinematic"
      >
        <FilmIcon />
      </Button>
      <Button
        handler={() => setVariation('languid')}
        active={variation === 'languid'}
        aria-label="Set variation to languid"
      >
        <CloudIcon />
      </Button>
      <Button
        handler={() => setVariation('sharkbite')}
        active={variation === 'sharkbite'}
        aria-label="Set variation to sharkbite"
      >
        <FireIcon />
      </Button>
    </div>
  )
}
