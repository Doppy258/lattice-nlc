import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base keeps static assets working on sub-path deploys and previews.
export default defineConfig({
  base: './',
  plugins: [react()],
})
