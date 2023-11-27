import "./input-type-selector.css"
export function InputTypeSelector({setColorSpace, current}: {setColorSpace: Function, current:string}) {
  const colorSpaceTypes = ['hex', 'rgb', 'hsl', 'lch', 'oklch', 'lab', 'oklab', 'p3'] as const

  return (
    <div className="input-type-selectors">
      {colorSpaceTypes.map((type: string) => (
        <button className={`input-type-selector ${type === current ? 'active' : ''}`} onClick={() => setColorSpace(type)} key={type}>
          <div className="indicator"></div>
          <p>{type}</p>
        </button>
      ))}
    </div>
  )
}
