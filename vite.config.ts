import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

// Two entry points build as one project:
//   index.html  → the Lattice landing page (marketing)
//   app.html    → the Lattice app we built (hash-routed, offline-capable)
// Relative base keeps assets working on sub-path deploys (e.g. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src/ping'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index.html'),
        app: path.resolve(root, 'app.html'),
      },
    },
  },
})
