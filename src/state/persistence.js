// Browser-local persistence.
//
// The simulator is used in sessions that span reloads: an instructor sets up
// a scenario, the tab is refreshed or reopened the next morning, and having
// to rebuild the whole configuration each time is friction with no teaching
// value. Configuration and the event log therefore survive a reload.
//
// Three deliberate boundaries:
//
// Only configuration is stored — never running state. Screen, alarms, the
// waveform and the flush timer are all reconstructed from scratch, so a
// reload always lands in standby with nothing being delivered. Restoring a
// device into "ventilating" from a cache would be a fiction, and a
// dangerous-looking one.
//
// Storage is best-effort. Private-browsing modes and full quotas make every
// read and write fallible, so nothing here throws: a failed read yields the
// defaults and a failed write is reported, never fatal. The simulator must
// run with storage entirely unavailable.
//
// Stored data is versioned and discarded wholesale on a version change.
// Migrating a half-understood old shape into new code is how a stale field
// ends up driving a setting nobody set.

export const STORAGE_VERSION = 1

export const STORAGE_KEYS = {
  CONFIG: 'ventsim.config.v1',
  LOG: 'ventsim.log.v1',
}

function storage() {
  try {
    // Touching localStorage itself throws in some privacy modes, so even the
    // availability check has to be guarded.
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

export function isStorageAvailable() {
  const store = storage()
  if (!store) return false
  try {
    const probe = '__ventsim_probe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function readKey(key) {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // A payload written by a different schema is not partially usable.
    if (!parsed || parsed.version !== STORAGE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeKey(key, payload) {
  const store = storage()
  if (!store) return { ok: false, reason: 'unavailable' }
  try {
    store.setItem(key, JSON.stringify({ version: STORAGE_VERSION, ...payload }))
    return { ok: true }
  } catch (error) {
    // A quota failure is the expected one: the log is the thing that grows.
    return { ok: false, reason: error?.name === 'QuotaExceededError' ? 'quota' : 'error' }
  }
}

// Fields of the application state that are configuration rather than running
// state. Anything not named here is rebuilt on load.
export const PERSISTED_CONFIG_FIELDS = [
  'settings',
  'patientData',
  'patientKey',
  'theme',
  'selectedMeasurements',
  'layout',
  'licence',
  'units',
  'language',
]

// Stored values are merged over the defaults rather than replacing them, so a
// field added after the cache was written takes its default instead of
// arriving undefined. Nested objects that are keyed records — alarm limits,
// licence features — are merged one level deeper for the same reason.
const DEEP_MERGE_FIELDS = new Set(['settings', 'patientData', 'licence', 'units', 'layout'])

function mergeField(field, fallback, stored) {
  if (stored == null) return fallback
  if (Array.isArray(fallback)) return Array.isArray(stored) ? stored : fallback
  if (DEEP_MERGE_FIELDS.has(field) && typeof stored === 'object' && typeof fallback === 'object') {
    const merged = { ...fallback, ...stored }
    for (const [key, value] of Object.entries(fallback)) {
      if (value && typeof value === 'object' && !Array.isArray(value)
        && stored[key] && typeof stored[key] === 'object' && !Array.isArray(stored[key])) {
        merged[key] = { ...value, ...stored[key] }
      }
    }
    return merged
  }
  return stored
}

export function mergeConfig(defaults, stored) {
  const out = {}
  for (const field of PERSISTED_CONFIG_FIELDS) {
    out[field] = mergeField(field, defaults[field], stored?.[field])
  }
  return out
}

export function loadConfig(defaults) {
  const payload = readKey(STORAGE_KEYS.CONFIG)
  return {
    config: mergeConfig(defaults, payload?.config ?? null),
    restored: Boolean(payload?.config),
    savedAt: payload?.savedAt ?? null,
  }
}

export function saveConfig(config) {
  const picked = {}
  for (const field of PERSISTED_CONFIG_FIELDS) picked[field] = config[field]
  return writeKey(STORAGE_KEYS.CONFIG, { savedAt: new Date().toISOString(), config: picked })
}

export function loadEvents() {
  const payload = readKey(STORAGE_KEYS.LOG)
  return Array.isArray(payload?.events) ? payload.events : []
}

export function saveEvents(events) {
  return writeKey(STORAGE_KEYS.LOG, { savedAt: new Date().toISOString(), events })
}

// Clearing is offered separately for configuration and log because they are
// wanted separately: a new scenario wants fresh settings but may want the
// preceding log kept for review, and a fresh class wants the log emptied
// without rebuilding the configuration.
export const CLEARABLE = {
  CONFIG: 'config',
  LOG: 'log',
  ALL: 'all',
}

export function clearStored(what = CLEARABLE.ALL) {
  const store = storage()
  if (!store) return { ok: false, reason: 'unavailable' }
  const keys = []
  if (what === CLEARABLE.CONFIG || what === CLEARABLE.ALL) keys.push(STORAGE_KEYS.CONFIG)
  if (what === CLEARABLE.LOG || what === CLEARABLE.ALL) keys.push(STORAGE_KEYS.LOG)
  try {
    for (const key of keys) store.removeItem(key)
    return { ok: true, cleared: keys }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

// Approximate stored size, shown so the operator can see what clearing would
// recover rather than being asked to trust that it matters.
export function storedBytes() {
  const store = storage()
  if (!store) return { config: 0, log: 0, total: 0 }
  const sizeOf = (key) => {
    try {
      return (store.getItem(key) ?? '').length
    } catch {
      return 0
    }
  }
  const config = sizeOf(STORAGE_KEYS.CONFIG)
  const log = sizeOf(STORAGE_KEYS.LOG)
  return { config, log, total: config + log }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
