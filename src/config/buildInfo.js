// Build identity stamped in by Vite at build time (see vite.config.js).
// The globals are replaced literally during the build, so the fallbacks
// only apply under a test runner that does not define them.

/* global __BUILD_ID__, __BUILD_TIME__ */

export const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'
export const BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : null

export function formatBuildTime(iso = BUILD_TIME) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().replace('T', ' ').slice(0, 16) + 'Z'
}
