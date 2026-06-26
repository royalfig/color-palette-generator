import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import babel from "@rolldown/plugin-babel"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // To re-enable React Compiler: install @rolldown/plugin-babel, then:
    // import babel from '@rolldown/plugin-babel'
    // import { reactCompilerPreset } from '@vitejs/plugin-react'
    // plugins: [react(), babel({ presets: [reactCompilerPreset()] })]
    react(),
    babel({
      presets: [reactCompilerPreset()]
    })
  ],
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
