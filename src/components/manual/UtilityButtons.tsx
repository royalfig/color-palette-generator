import { ManualHeader } from './ManualHeader'
import { Page } from './Page'

const id = 'utility-buttons'
const title = 'Utility Buttons'

export function UtilityButtonsHeader() {
  return ManualHeader(id, title)
}

export function UtilityButtons() {
  return (
    <Page id={id} title={title}>
      <p>
        The utility buttons provide quick access to helpful features that enhance your color exploration experience.
      </p>

      <h3>1. Random Color Button (Shuffle)</h3>
      <p>
        The <strong>Shuffle</strong> button instantly generates a random color to use as your base:
      </p>
      <ul>
        <li>Picks from a curated selection of aesthetically pleasing colors</li>
        <li>Covers the full spectrum with good distribution</li>
        <li>Instantly updates the color input and generates a new palette</li>
        <li>Great for inspiration when you don't have a specific color in mind</li>
      </ul>

      <h3>2. Help Button (Manual)</h3>
      <p>
        The <strong>Question Mark</strong> button opens this manual in a new window.
      </p>
    </Page>
  )
}
