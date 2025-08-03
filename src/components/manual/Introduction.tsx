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
      <p>
        The Color Palette Pro is a tool for creating color palettes programmatically, which means great results aren't
        guaranteed.
      </p>
      <p>
        As the creator of this machine, I've learned, after many trials, that truly great color palettes remain an art
        form.
      </p>
      <p>And while the Color Palette Pro will get you on your way, it'll never supplant a good eye.</p>
      <p>Nevertheless, let's get started.</p>
    </Page>
  )
}
