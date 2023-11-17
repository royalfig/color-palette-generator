import "./vibrancy_module.css"

export function VibrancyModule({palettes}) {

    
    const colors = palettes.polychromia.keel.reduce((acc, curr, idx) => {

        acc[`--vm-${idx}`] = curr.hex;

        return acc;


    }, {})
    console.log("🚀 ~ file: VibrancyModule.tsx:14 ~ colors ~ colors:", colors)
    
    return (
        <div className="vibrancy-module relative" style={colors}></div>
    )
}