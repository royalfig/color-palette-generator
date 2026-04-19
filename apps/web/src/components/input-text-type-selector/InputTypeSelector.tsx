import Button from "../button/Button"
import "./input-type-selector.css"

export function InputTypeSelector({setColorSpace, current}: {setColorSpace: Function, current:string}) {
  const colorSpaceTypes = ['hex', 'rgb', 'hsl', 'p3', 'lch', 'oklch', 'lab', 'oklab'] as const

  return (
    <div className="input-type-selectors">
      {colorSpaceTypes.map((type: string) => (
        <Button handler={() => setColorSpace(type)} active={type === current} key={type}>
          {type}
        </Button>
      ))}
    </div>
  )
}
