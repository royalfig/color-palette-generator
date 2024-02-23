import { AdjustmentsHorizontalIcon, CloudIcon, FilmIcon, FireIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { Dispatch } from 'react';
import { Variations } from '../../types';
import Button from '../button/Button';
import './variationSelector.css';

type VariationStrings = keyof Variations

function fmtAriaTxt(variation: VariationStrings) {
  return `Set variation to ${variation}`
}

export function VariationSelector({ variation, setVariation }: { variation: VariationStrings; setVariation: Dispatch<VariationStrings> }) {
  return (
    <div className="variation-selector-container">
      <Button
        handler={() => setVariation('og')}
        active={variation === 'og'}
        aria-label={fmtAriaTxt('og')}
      >
        <AdjustmentsHorizontalIcon />
      </Button>
      <Button handler={() => setVariation('keel')} active={variation === 'keel'} aria-label={fmtAriaTxt('keel')}>
        <ScaleIcon />
      </Button>
      <Button
        handler={() => setVariation('film')}
        active={variation === 'film'}
        aria-label={fmtAriaTxt('film')}
      >
        <FilmIcon />
      </Button>
      <Button
        handler={() => setVariation('cloud')}
        active={variation === 'cloud'}
        aria-label={fmtAriaTxt('cloud')}
      >
        <CloudIcon />
      </Button>
      <Button
        handler={() => setVariation('fire')}
        active={variation === 'fire'}
        aria-label={fmtAriaTxt('fire')}
      >
        <FireIcon />
      </Button>
    </div>
  )
}
