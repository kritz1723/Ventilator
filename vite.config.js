import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build identity is stamped in at build time so a deployed page can always
// be traced back to the commit it came from. CI provides the SHA directly;
// a local build falls back to asking git.
function resolveBuildId() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'local'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built site works at any path (GitHub Pages
  // project subpath, a custom domain, or opened from disk).
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(resolveBuildId()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
