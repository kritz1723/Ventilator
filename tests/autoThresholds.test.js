import { describe, it, expect } from 'vitest'
import {
  DERIVATION, deriveLimit, deriveAll, proposeLimits,
} from '../src/engine/autoThresholds.js'

const numerics = {
  peakPressure: 20,
  minuteVolume: 6.3,
  tidalVolumeExhaled: 450,
  measuredRR: 14,
}

describe('derivation direction', () => {
  it('places an upper limit above the measured value', () => {
    expect(deriveLimit('highPressure', numerics)).toBeGreaterThan(numerics.peakPressure)
    expect(deriveLimit('highMinuteVolume', numerics)).toBeGreaterThan(numerics.minuteVolume)
    expect(deriveLimit('highRespRate', numerics)).toBeGreaterThan(numerics.measuredRR)
  })

  it('places a lower limit below the measured value', () => {
    expect(deriveLimit('lowPressure', numerics)).toBeLessThan(numerics.peakPressure)
    expect(deriveLimit('lowMinuteVolume', numerics)).toBeLessThan(numerics.minuteVolume)
    expect(deriveLimit('lowTidalVolume', numerics)).toBeLessThan(numerics.tidalVolumeExhaled)
  })

  it('brackets the measured value on both sides for pressure', () => {
    const high = deriveLimit('highPressure', numerics)
    const low = deriveLimit('lowPressure', numerics)
    expect(low).toBeLessThan(numerics.peakPressure)
    expect(high).toBeGreaterThan(numerics.peakPressure)
  })
})

describe('margin', () => {
  it('uses the absolute margin when the relative margin would be smaller', () => {
    // 30 % of 10 is 3, which is below the 8 cmH2O absolute margin.
    expect(deriveLimit('highPressure', { ...numerics, peakPressure: 10 })).toBe(18)
  })

  it('uses the relative margin when it is the wider of the two', () => {
    // 30 % of 40 is 12, wider than the 8 cmH2O absolute margin.
    expect(deriveLimit('highPressure', { ...numerics, peakPressure: 40 })).toBe(52)
  })
})

describe('clamping', () => {
  it('never derives a high pressure limit above the ceiling', () => {
    // A dangerously high measured pressure must not be bracketed as normal.
    const limit = deriveLimit('highPressure', { ...numerics, peakPressure: 90 })
    expect(limit).toBe(DERIVATION.highPressure.max)
  })

  it('never derives a low pressure limit below its floor', () => {
    const limit = deriveLimit('lowPressure', { ...numerics, peakPressure: 3 })
    expect(limit).toBeGreaterThanOrEqual(DERIVATION.lowPressure.min)
  })

  it('keeps every derived limit inside its permitted band', () => {
    for (const peak of [1, 5, 20, 45, 120]) {
      const { derived } = deriveAll({ ...numerics, peakPressure: peak })
      for (const [key, value] of Object.entries(derived)) {
        expect(value, `${key} at peak ${peak}`).toBeGreaterThanOrEqual(DERIVATION[key].min)
        expect(value, `${key} at peak ${peak}`).toBeLessThanOrEqual(DERIVATION[key].max)
      }
    }
  })
})

describe('missing measurements', () => {
  it('derives nothing from an absent measurement', () => {
    expect(deriveLimit('highPressure', {})).toBeNull()
    expect(deriveLimit('highPressure', { peakPressure: null })).toBeNull()
    expect(deriveLimit('highPressure', { peakPressure: Number.NaN })).toBeNull()
  })

  it('derives nothing before a breath has been delivered', () => {
    const { derived, unavailable } = deriveAll({
      peakPressure: 0, minuteVolume: 0, tidalVolumeExhaled: 0, measuredRR: 0,
    })
    expect(Object.keys(derived)).toHaveLength(0)
    expect(unavailable).toHaveLength(Object.keys(DERIVATION).length)
  })

  it('reports which limits could not be derived rather than partially applying', () => {
    const { derived, unavailable } = deriveAll({ peakPressure: 20 })
    expect(Object.keys(derived)).toContain('highPressure')
    expect(unavailable).toContain('highMinuteVolume')
  })
})

describe('proposal', () => {
  const current = {
    highPressure: 40, lowPressure: 5, highMinuteVolume: 12,
    lowMinuteVolume: 3, lowTidalVolume: 250, highRespRate: 35,
  }

  it('reports the value being replaced alongside the derived value', () => {
    const { changes } = proposeLimits(numerics, current)
    const high = changes.find((c) => c.key === 'highPressure')
    expect(high.from).toBe(40)
    expect(high.to).toBe(deriveLimit('highPressure', numerics))
  })

  it('states the basis for each derived limit', () => {
    const { changes } = proposeLimits(numerics, current)
    for (const c of changes) {
      expect(c.basis, c.key).toBeTruthy()
    }
  })

  it('proposes no change for a limit already at the derived value', () => {
    const { derived } = deriveAll(numerics)
    const { changes } = proposeLimits(numerics, derived)
    expect(changes).toHaveLength(0)
  })
})
