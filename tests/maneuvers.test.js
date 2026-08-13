import { describe, it, expect } from 'vitest'
import { maneuverResult, holdPressure, MANEUVER } from '../src/engine/maneuvers.js'

describe('holdPressure', () => {
  it('equals PEEP when the lung has returned to its baseline volume', () => {
    expect(holdPressure({ volume: 0, compliance: 50, peep: 5 })).toBe(5)
  })

  it('adds the elastic recoil of the retained volume', () => {
    expect(holdPressure({ volume: 500, compliance: 50, peep: 5 })).toBeCloseTo(15, 6)
  })
})

describe('inspiratory hold', () => {
  it('recovers the compliance that was dialled in', () => {
    const result = maneuverResult({
      type: MANEUVER.INSPIRATORY_HOLD,
      volume: 500,
      compliance: 50,
      peep: 5,
    })
    const cstat = result.readings.find((r) => r.label === 'Cstat')
    expect(cstat.value).toBeCloseTo(50, 6)
  })

  it('reports driving pressure as plateau minus PEEP', () => {
    const result = maneuverResult({
      type: MANEUVER.INSPIRATORY_HOLD,
      volume: 400,
      compliance: 40,
      peep: 8,
    })
    expect(result.readings.find((r) => r.label === 'ΔP').value).toBeCloseTo(10, 6)
  })
})

describe('expiratory hold', () => {
  it('reports no intrinsic PEEP when the lung fully empties', () => {
    const result = maneuverResult({
      type: MANEUVER.EXPIRATORY_HOLD,
      volume: 0,
      compliance: 50,
      peep: 5,
    })
    expect(result.readings.find((r) => r.label === 'PEEPi').value).toBe(0)
    expect(result.readings.find((r) => r.label === 'PEEPtot').value).toBe(5)
  })

  it('reports trapped gas as intrinsic PEEP above the set level', () => {
    // 100 mL still in the lung at a compliance of 50 mL/cmH2O is 2 cmH2O.
    const result = maneuverResult({
      type: MANEUVER.EXPIRATORY_HOLD,
      volume: 100,
      compliance: 50,
      peep: 5,
    })
    expect(result.readings.find((r) => r.label === 'PEEPtot').value).toBeCloseTo(7, 6)
    expect(result.readings.find((r) => r.label === 'PEEPi').value).toBeCloseTo(2, 6)
  })

  it('never reports negative intrinsic PEEP', () => {
    const result = maneuverResult({
      type: MANEUVER.EXPIRATORY_HOLD,
      volume: 0,
      compliance: 50,
      peep: 0,
    })
    expect(result.readings.find((r) => r.label === 'PEEPi').value).toBeGreaterThanOrEqual(0)
  })
})
