import './css/Reset.css'
import './css/Defaults.css'
import './css/Variables.css'
import './css/App.css'
import { useState } from 'react'
import {createPalettes} from './util/palettes/palettes.js'

export default function App() {
    const [color, setColor] = useState('#21a623')
    
    const palettes = createPalettes(color)
    
    
    
  return (
    <main>
      <div className="synth-container">
        <div className="synth-left">
            <div className="current-color">
                <div style={{backgroundColor: palettes.complementary.original[0].hex, height: '1rem', width: '2rem' }}>

                </div>
            </div>
            <div className='color-selector'>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}/>
            </div>
        </div>
        <div className="synth-center"></div>
        <div className="synth-right"></div>
        <div className="synth-bottom">
          <h1 className="brand">
            <span>Color</span>Palette Pro
          </h1>
          <div className="vibrancy-module relative"></div>
        </div>
      </div>
    </main>
  )
}
