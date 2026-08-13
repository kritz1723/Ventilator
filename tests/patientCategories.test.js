import { describe, it, expect } from 'vitest'
import { PATIENT_CATEGORIES, COMMON_RANGES, rangeFor } from '../src/engine/patientCategories.js'

describe('composite setting ranges', () => {
  it('spans the adult tidal volume range', () => {
    const vt = rangeFor('adult', 'tidalVolume')
    expect(vt.min).toBe(100)
    expect(vt.max).toBe(2000)
  })

  it('narrows tidal volume for smaller patients', () => {
    const adult = rangeFor('adult', 'tidalVolume')
    const paed = rangeFor('paediatric', 'tidalVolume')
    const neo = rangeFor('neonatal', 'tidalVolume')
    expect(paed.max).toBeLessThan(adult.max)
    expect(neo.max).toBeLessThan(paed.max)
    expect(neo.min).toBeLessThan(paed.min)
  })

  it('allows a higher rate ceiling for neonates', () => {
    expect(rangeFor('neonatal', 'respRate').max).toBeGreaterThan(rangeFor('adult', 'respRate').max)
  })

  it('offers PEEP up to 50 cmH2O in 1 cmH2O steps for adults', () => {
    const peep = rangeFor('adult', 'peep')
    expect(peep.min).toBe(0)
    expect(peep.max).toBe(50)
    expect(peep.step).toBe(1)
  })

  it('sets FiO2 at 21-100% in 1% steps independent of category', () => {
    expect(COMMON_RANGES.fio2).toEqual({ min: 21, max: 100, step: 1 })
    expect(rangeFor('neonatal', 'fio2')).toEqual(COMMON_RANGES.fio2)
  })

  it('keeps every default inside its own range', () => {
    for (const cat of Object.values(PATIENT_CATEGORIES)) {
      for (const [key, value] of Object.entries(cat.defaults)) {
        const r = cat.ranges[key]
        expect(value, `${cat.id}.${key}`).toBeGreaterThanOrEqual(r.min)
        expect(value, `${cat.id}.${key}`).toBeLessThanOrEqual(r.max)
      }
    }
  })
})
