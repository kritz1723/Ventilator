import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CONFIG_DEFAULTS, CONFIG_FIELDS } from '../src/state/configDefaults.js'
import {
  STORAGE_KEYS, STORAGE_VERSION, PERSISTED_CONFIG_FIELDS, CLEARABLE,
  mergeConfig, loadConfig, saveConfig, loadEvents, saveEvents, clearStored,
  isStorageAvailable, storedBytes, formatBytes,
} from '../src/state/persistence.js'

// A minimal in-memory stand-in for the browser store, so the module is
// exercised through the same interface it uses in the app.
function makeStorage({ failWrites = false } = {}) {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (failWrites) {
        const error = new Error('quota')
        error.name = 'QuotaExceededError'
        throw error
      }
      map.set(k, String(v))
    },
    removeItem: (k) => map.delete(k),
    _map: map,
  }
}

const DEFAULTS = {
  settings: { mode: 'VC-CMV', peep: 5, alarmLimits: { highPressure: 40, lowPressure: 5 } },
  patientData: { category: 'adult', heightCm: 175 },
  patientKey: 'normal',
  theme: 'dark',
  selectedMeasurements: ['ppeak', 'vte'],
  layout: { traces: 3 },
  licence: { tier: 'base', features: { loops: false } },
  units: { pressure: 'cmH2O' },
  language: 'en',
}

beforeEach(() => {
  globalThis.localStorage = makeStorage()
})

afterEach(() => {
  delete globalThis.localStorage
})

describe('storage availability', () => {
  it('reports available when the store round-trips a probe', () => {
    expect(isStorageAvailable()).toBe(true)
  })

  it('reports unavailable when writes throw', () => {
    globalThis.localStorage = makeStorage({ failWrites: true })
    expect(isStorageAvailable()).toBe(false)
  })

  // The simulator has to run with storage entirely absent.
  it('falls back to defaults with no store at all', () => {
    delete globalThis.localStorage
    expect(isStorageAvailable()).toBe(false)
    expect(loadConfig(DEFAULTS).config.settings.peep).toBe(5)
    expect(loadEvents()).toEqual([])
    expect(saveConfig(DEFAULTS).ok).toBe(false)
  })
})

describe('configuration round trip', () => {
  it('restores exactly what was saved', () => {
    const config = { ...DEFAULTS, settings: { ...DEFAULTS.settings, peep: 8 }, language: 'de' }
    expect(saveConfig(config).ok).toBe(true)

    const loaded = loadConfig(DEFAULTS)
    expect(loaded.restored).toBe(true)
    expect(loaded.config.settings.peep).toBe(8)
    expect(loaded.config.language).toBe('de')
    expect(loaded.savedAt).toBeTruthy()
  })

  it('stores only the declared configuration fields', () => {
    saveConfig({ ...DEFAULTS, screen: 'ventilating', alarms: ['x'], waveform: [1, 2, 3] })
    const payload = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEYS.CONFIG))
    // A subset rather than an equality: a field absent from the object being
    // saved is simply not written, and this fixture is deliberately partial.
    for (const key of Object.keys(payload.config)) {
      expect(PERSISTED_CONFIG_FIELDS, key).toContain(key)
    }
    for (const key of ['screen', 'alarms', 'waveform']) {
      expect(Object.keys(payload.config), key).not.toContain(key)
    }
  })

  // Restoring a device into "ventilating" from a cache would be a fiction.
  it('never carries running state across a reload', () => {
    saveConfig({ ...DEFAULTS, screen: 'ventilating' })
    expect(loadConfig(DEFAULTS).config.screen).toBeUndefined()
  })

  it('reports nothing restored on a first run', () => {
    const loaded = loadConfig(DEFAULTS)
    expect(loaded.restored).toBe(false)
    expect(loaded.config).toEqual(DEFAULTS)
  })

  it('discards a payload written by another schema version', () => {
    globalThis.localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({
      version: STORAGE_VERSION + 1, config: { language: 'fr' },
    }))
    expect(loadConfig(DEFAULTS).config.language).toBe('en')
  })

  it('discards unparseable stored data rather than throwing', () => {
    globalThis.localStorage.setItem(STORAGE_KEYS.CONFIG, '{not json')
    expect(() => loadConfig(DEFAULTS)).not.toThrow()
    expect(loadConfig(DEFAULTS).restored).toBe(false)
  })

  it('reports a quota failure without throwing', () => {
    globalThis.localStorage = makeStorage({ failWrites: true })
    expect(saveConfig(DEFAULTS)).toEqual({ ok: false, reason: 'quota' })
  })
})

describe('merging stored values over defaults', () => {
  // A field added after the cache was written must take its default rather
  // than arriving undefined and driving a control from nothing.
  it('fills in fields absent from the stored copy', () => {
    const merged = mergeConfig(DEFAULTS, { language: 'de' })
    expect(merged.language).toBe('de')
    expect(merged.theme).toBe('dark')
    expect(merged.patientKey).toBe('normal')
  })

  it('merges keyed records one level deeper', () => {
    const merged = mergeConfig(DEFAULTS, { settings: { alarmLimits: { highPressure: 35 } } })
    expect(merged.settings.alarmLimits).toEqual({ highPressure: 35, lowPressure: 5 })
    expect(merged.settings.mode).toBe('VC-CMV')
  })

  it('replaces arrays rather than merging them', () => {
    expect(mergeConfig(DEFAULTS, { selectedMeasurements: ['peep'] }).selectedMeasurements)
      .toEqual(['peep'])
  })

  it('ignores a stored array whose shape is wrong', () => {
    expect(mergeConfig(DEFAULTS, { selectedMeasurements: 'ppeak' }).selectedMeasurements)
      .toEqual(['ppeak', 'vte'])
  })
})

describe('event log persistence', () => {
  const events = [
    { seq: 2, category: 'alarm', message: 'High pressure' },
    { seq: 1, category: 'setting', message: 'PEEP 5 → 8' },
  ]

  it('round-trips the log', () => {
    expect(saveEvents(events).ok).toBe(true)
    expect(loadEvents()).toEqual(events)
  })

  it('returns an empty log when nothing is stored', () => {
    expect(loadEvents()).toEqual([])
  })

  it('returns an empty log when the stored value is not a list', () => {
    globalThis.localStorage.setItem(STORAGE_KEYS.LOG, JSON.stringify({
      version: STORAGE_VERSION, events: 'nope',
    }))
    expect(loadEvents()).toEqual([])
  })

  // A quota failure on the growing log must not take the configuration down
  // with it, which is why the two live under separate keys.
  it('keeps configuration readable after a log write fails', () => {
    saveConfig(DEFAULTS)
    const store = globalThis.localStorage
    const original = store.setItem
    store.setItem = (k) => {
      if (k === STORAGE_KEYS.LOG) {
        const error = new Error('quota')
        error.name = 'QuotaExceededError'
        throw error
      }
      return original.call(store, k)
    }
    expect(saveEvents(events).ok).toBe(false)
    store.setItem = original
    expect(loadConfig(DEFAULTS).restored).toBe(true)
  })
})

describe('clearing stored data', () => {
  beforeEach(() => {
    saveConfig(DEFAULTS)
    saveEvents([{ seq: 1, category: 'alarm', message: 'x' }])
  })

  it('clears configuration while keeping the log', () => {
    expect(clearStored(CLEARABLE.CONFIG).ok).toBe(true)
    expect(loadConfig(DEFAULTS).restored).toBe(false)
    expect(loadEvents()).toHaveLength(1)
  })

  it('clears the log while keeping configuration', () => {
    clearStored(CLEARABLE.LOG)
    expect(loadEvents()).toEqual([])
    expect(loadConfig(DEFAULTS).restored).toBe(true)
  })

  it('clears both', () => {
    clearStored(CLEARABLE.ALL)
    expect(loadConfig(DEFAULTS).restored).toBe(false)
    expect(loadEvents()).toEqual([])
  })

  it('touches no other key in the store', () => {
    globalThis.localStorage.setItem('unrelated', 'keep me')
    clearStored(CLEARABLE.ALL)
    expect(globalThis.localStorage.getItem('unrelated')).toBe('keep me')
  })
})

describe('reporting stored size', () => {
  it('sums the two keys', () => {
    saveConfig(DEFAULTS)
    saveEvents([{ seq: 1, category: 'alarm', message: 'x' }])
    const bytes = storedBytes()
    expect(bytes.config).toBeGreaterThan(0)
    expect(bytes.log).toBeGreaterThan(0)
    expect(bytes.total).toBe(bytes.config + bytes.log)
  })

  it('reports zero with no store', () => {
    delete globalThis.localStorage
    expect(storedBytes()).toEqual({ config: 0, log: 0, total: 0 })
  })

  it('formats sizes for reading', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 kB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})

// A hand-maintained second list of persisted fields is a list that drifts:
// a field added to the defaults and forgotten in the list is silently never
// saved, and the symptom — a setting that quietly fails to survive a reload
// — points at storage rather than at the omission. Deriving one from the
// other removes the failure mode; this holds it removed.
describe('the persisted field list cannot drift from the defaults', () => {
  it('persists exactly the fields the defaults define', () => {
    expect([...PERSISTED_CONFIG_FIELDS].sort()).toEqual([...CONFIG_FIELDS].sort())
  })

  it('gives every configuration field a default', () => {
    for (const field of PERSISTED_CONFIG_FIELDS) {
      expect(CONFIG_DEFAULTS[field], field).toBeDefined()
    }
  })

  it('round-trips every configuration field the application holds', () => {
    saveConfig(CONFIG_DEFAULTS)
    const loaded = loadConfig(CONFIG_DEFAULTS)
    for (const field of CONFIG_FIELDS) {
      expect(loaded.config[field], field).toBeDefined()
    }
  })

  // Running state must stay out of the stored payload, whatever is added to
  // the configuration in future.
  it('names no running state among the persisted fields', () => {
    const running = ['screen', 'alarms', 'waveform', 'flush', 'frozen', 'events', 'snapshots', 'lockState', 'arranging']
    for (const field of running) {
      expect(PERSISTED_CONFIG_FIELDS, field).not.toContain(field)
    }
  })
})
