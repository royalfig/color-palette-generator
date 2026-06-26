import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'introduction'
const title = 'Introduction'

export function IntroductionHeader() {
  return ManualHeader(id, title)
}

export function Introduction() {
  return (
    <Page id={id} title="Introduction">
      <p>A word of warning.</p>
      <p>
        As the creator of this machine, I've learned, after many trials, that truly great color palettes remain an art
        form.
      </p>
      <p>And while the ColorPalette Pro will get you wellon your way, it's no substitute for a good eye.</p>
      <p>
        I've also learned there's a profound pleasure in color itself. Their combination can be harmonic, dissonant,
        even narrative.
      </p>
      <p>Making palettes with a synthesizer, then, doesn't seem so farfetched. So let's make some palettes.</p>
    </Page>
  )
}
