import { describe, it, expect } from 'vitest'
import {
  createEvent, appendEvent, diffSettings, diffAlarms, filterEvents,
  EVENT_CATEGORY, ACTION_CATEGORIES, MAX_EVENTS, toCsv,
} from '../src/engine/eventLog.js'

const settings = {
  mode: 'VC-CMV', respRate: 14, tidalVolume: 450, pInsp: 15, peep: 5,
  fio2: 40, pauseTime: 0.3, triggerFlow: 2, flowPattern: 'square',
  alarmLimits: { highPressure: 40, lowPressure: 5 },
}

describe('diffSettings', () => {
  it('records the old and the new value of a changed setting', () => {
    const events = diffSettings(settings, { ...settings, peep: 8 })
    expect(events).toHaveLength(1)
    expect(events[0].category).toBe(EVENT_CATEGORY.SETTING)
    expect(events[0].message).toContain('5')
    expect(events[0].message).toContain('8')
  })

  it('records one event per changed field', () => {
    const events = diffSettings(settings, { ...settings, peep: 8, fio2: 60 })
    expect(events).toHaveLength(2)
  })

  it('records a mode change under its own category', () => {
    const events = diffSettings(settings, { ...settings, mode: 'PC-CMV' })
    expect(events[0].category).toBe(EVENT_CATEGORY.MODE)
  })

  it('records alarm limit changes', () => {
    const events = diffSettings(settings, {
      ...settings, alarmLimits: { ...settings.alarmLimits, highPressure: 45 },
    })
    expect(events).toHaveLength(1)
    expect(events[0].message).toContain('High pressure limit')
  })

  it('produces nothing when nothing changed', () => {
    expect(diffSettings(settings, { ...settings })).toHaveLength(0)
  })
})

describe('diffAlarms', () => {
  const high = { id: 'high-pressure', priority: 'high', label: 'High Paw', message: 'High airway pressure', detail: 'Limit 40' }

  it('logs an alarm when it starts, carrying its priority', () => {
    const events = diffAlarms([], [high])
    expect(events).toHaveLength(1)
    expect(events[0].severity).toBe('high')
  })

  it('logs nothing while an alarm persists', () => {
    expect(diffAlarms([high], [high])).toHaveLength(0)
  })

  it('logs when an alarm clears', () => {
    const events = diffAlarms([high], [])
    expect(events).toHaveLength(1)
    expect(events[0].message).toContain('cleared')
  })
})

describe('filterEvents', () => {
  const log = [
    createEvent({ category: EVENT_CATEGORY.ALARM, severity: 'high', message: 'High Paw' }),
    createEvent({ category: EVENT_CATEGORY.SETTING, message: 'PEEP: 5 → 8' }),
    createEvent({ category: EVENT_CATEGORY.MANEUVER, message: 'Expiratory hold' }),
  ]

  it('filters to alarms only', () => {
    const out = filterEvents(log, { categories: [EVENT_CATEGORY.ALARM] })
    expect(out).toHaveLength(1)
    expect(out[0].category).toBe(EVENT_CATEGORY.ALARM)
  })

  it('filters to operator actions only', () => {
    const out = filterEvents(log, { categories: ACTION_CATEGORIES })
    expect(out).toHaveLength(2)
    expect(out.every((e) => e.category !== EVENT_CATEGORY.ALARM)).toBe(true)
  })

  it('filters by severity', () => {
    expect(filterEvents(log, { severities: ['high'] })).toHaveLength(1)
  })

  it('filters by free text, case insensitively', () => {
    expect(filterEvents(log, { query: 'peep' })).toHaveLength(1)
    expect(filterEvents(log, { query: 'nothing here' })).toHaveLength(0)
  })

  it('returns everything with no filter', () => {
    expect(filterEvents(log, {})).toHaveLength(3)
  })
})

describe('log storage', () => {
  it('puts the newest event first and bounds the length', () => {
    let log = []
    for (let i = 0; i < MAX_EVENTS + 10; i += 1) {
      log = appendEvent(log, createEvent({ category: EVENT_CATEGORY.STATE, message: `e${i}` }))
    }
    expect(log).toHaveLength(MAX_EVENTS)
    expect(log[0].message).toBe(`e${MAX_EVENTS + 9}`)
  })

  it('exports CSV with quoted fields', () => {
    const csv = toCsv([createEvent({ category: EVENT_CATEGORY.SETTING, message: 'PEEP: 5 → 8' })])
    expect(csv.split('\n')[0]).toContain('seq,timestamp,category')
    expect(csv).toContain('"PEEP: 5 → 8"')
  })
})
