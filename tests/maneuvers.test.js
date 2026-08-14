import { describe, it, expect } from 'vitest'
import {
  maneuverResult, holdPressure, MANEUVER,
  HOLD_LIMITS, HOLD_DURATION_SECONDS, maxHoldSeconds, holdRemaining, shouldAutoRelease,
} from '../src/engine/maneuvers.js'

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

describe('hold bounds', () => {
  it('bounds every maneuver with a maximum duration', () => {
    for (const type of Object.keys(HOLD_LIMITS)) {
      expect(maxHoldSeconds(type), type).toBeGreaterThan(0)
    }
  })

  it('allows an expiratory hold longer than an inspiratory one', () => {
    // Trapped gas needs time to equilibrate before total PEEP can be read,
    // whereas an inspiratory hold suspends delivery and is kept short.
    expect(maxHoldSeconds('expHold')).toBeGreaterThan(maxHoldSeconds('inspHold'))
  })

  it('auto-releases once the maximum is reached', () => {
    for (const type of Object.keys(HOLD_LIMITS)) {
      const max = maxHoldSeconds(type)
      expect(shouldAutoRelease(type, max - 0.1), type).toBe(false)
      expect(shouldAutoRelease(type, max), type).toBe(true)
      expect(shouldAutoRelease(type, max + 5), type).toBe(true)
    }
  })

  it('counts down and never reports negative time remaining', () => {
    expect(holdRemaining('expHold', 0)).toBe(maxHoldSeconds('expHold'))
    expect(holdRemaining('expHold', 5)).toBe(maxHoldSeconds('expHold') - 5)
    expect(holdRemaining('expHold', 999)).toBe(0)
  })

  it('falls back to the default bound for an unknown maneuver', () => {
    expect(maxHoldSeconds('nonsense')).toBe(HOLD_DURATION_SECONDS)
  })
})
