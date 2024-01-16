import Button from "../button/Button"
import "./input-type-selector.css"

export function InputTypeSelector({setColorSpace, current}: {setColorSpace: Function, current:string}) {
  const colorSpaceTypes = ['hex', 'rgb', 'hsl', 'lch', 'oklch', 'lab', 'oklab', 'p3'] as const

  return (
    <div className="input-type-selectors">
      {colorSpaceTypes.map((type: string) => (
        <Button handler={() => setColorSpace(type)} active={type === current}>
          {type}
        </Button>
      ))}
    </div>
  )
}