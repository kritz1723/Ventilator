import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built site works at any path (GitHub Pages
  // project subpath, a custom domain, or opened from disk).
  base: './',
})
