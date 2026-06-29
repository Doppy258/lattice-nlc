import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { assistantProxy } from './plugins/assistantProxy'

// Relative base keeps static assets working on sub-path deploys and previews.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), assistantProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
