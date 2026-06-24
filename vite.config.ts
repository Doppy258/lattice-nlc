import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base keeps static assets working on sub-path deploys and previews.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
