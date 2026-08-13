import { describe, it, expect } from 'vitest'
import { createSnapshot, addSnapshot, diffValue, MAX_SNAPSHOTS } from '../src/engine/snapshots.js'

const base = {
  numerics: { peakPressure: 20, plateauPressure: 15, peep: 5, tidalVolumeExhaled: 450 },
  measurements: { cstat: 45, cdyn: 30 },
  settings: { mode: 'VC-CMV', respRate: 14, tidalVolume: 450, pInsp: 15, peep: 5, fio2: 40 },
  patient: { label: 'Normal', compliance: 50, resistance: 8 },
}

describe('createSnapshot', () => {
  it('records the settings and mechanics in force at capture time', () => {
    const snap = createSnapshot(base)
    expect(snap.mode).toBe('VC-CMV')
    expect(snap.patient.compliance).toBe(50)
    expect(snap.settings.peep).toBe(5)
    expect(snap.numerics.peakPressure).toBe(20)
  })

  it('copies values so later mutation of the source does not alter the capture', () => {
    const numerics = { ...base.numerics }
    const snap = createSnapshot({ ...base, numerics })
    numerics.peakPressure = 99
    expect(snap.numerics.peakPressure).toBe(20)
  })

  it('gives each capture a distinct identifier', () => {
    const a = createSnapshot(base)
    const b = createSnapshot(base)
    expect(a.id).not.toBe(b.id)
  })
})

describe('addSnapshot', () => {
  it('puts the newest capture first', () => {
    const a = createSnapshot(base)
    const b = createSnapshot(base)
    const list = addSnapshot(addSnapshot([], a), b)
    expect(list[0].id).toBe(b.id)
  })

  it('bounds the history length', () => {
    let list = []
    for (let i = 0; i < MAX_SNAPSHOTS + 5; i += 1) {
      list = addSnapshot(list, createSnapshot(base))
    }
    expect(list).toHaveLength(MAX_SNAPSHOTS)
  })
})

describe('diffValue', () => {
  it('subtracts the reference from the current value', () => {
    expect(diffValue(10, 14)).toBe(4)
    expect(diffValue(14, 10)).toBe(-4)
  })

  it('returns null when either side is missing rather than implying no change', () => {
    expect(diffValue(null, 10)).toBeNull()
    expect(diffValue(10, null)).toBeNull()
    expect(diffValue(Number.NaN, 10)).toBeNull()
  })
})
