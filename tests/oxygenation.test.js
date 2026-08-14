import { describe, it, expect } from 'vitest'
import {
  FLUSH_DURATION_SECONDS, FLUSH_FIO2,
  startFlush, flushRemaining, isFlushActive, effectiveFio2,
  alveolarPO2, saturationFor, estimatedPaco2, shuntPenaltyFor,
  targetSpo2, stepSpo2,
} from '../src/engine/oxygenation.js'

const settings = { fio2: 40 }

describe('oxygen flush', () => {
  const t0 = 1_000_000

  it('delivers 100 % oxygen while running', () => {
    const flush = startFlush(t0)
    expect(effectiveFio2(settings, flush, t0 + 1000)).toBe(FLUSH_FIO2)
  })

  it('runs for the stated duration and no longer', () => {
    const flush = startFlush(t0)
    expect(isFlushActive(flush, t0 + (FLUSH_DURATION_SECONDS - 1) * 1000)).toBe(true)
    expect(isFlushActive(flush, t0 + (FLUSH_DURATION_SECONDS + 1) * 1000)).toBe(false)
  })

  it('returns to the set FiO2 once it expires', () => {
    const flush = startFlush(t0)
    expect(effectiveFio2(settings, flush, t0 + (FLUSH_DURATION_SECONDS + 1) * 1000)).toBe(40)
  })

  it('does not alter the set FiO2', () => {
    const flush = startFlush(t0)
    effectiveFio2(settings, flush, t0 + 1000)
    expect(settings.fio2).toBe(40)
  })

  it('counts down and floors at zero', () => {
    const flush = startFlush(t0)
    expect(flushRemaining(flush, t0)).toBe(FLUSH_DURATION_SECONDS)
    expect(flushRemaining(flush, t0 + 60_000)).toBe(60)
    expect(flushRemaining(flush, t0 + 999_000)).toBe(0)
  })

  it('is inactive when none has been started', () => {
    expect(isFlushActive(null, t0)).toBe(false)
    expect(effectiveFio2(settings, null, t0)).toBe(40)
    expect(flushRemaining(null, t0)).toBe(0)
  })
})

describe('gas exchange model', () => {
  it('raises alveolar oxygen with inspired oxygen', () => {
    expect(alveolarPO2(100)).toBeGreaterThan(alveolarPO2(50))
    expect(alveolarPO2(50)).toBeGreaterThan(alveolarPO2(21))
  })

  it('produces a saturation that rises with oxygen tension and stays bounded', () => {
    expect(saturationFor(100)).toBeGreaterThan(saturationFor(60))
    for (const po2 of [0, 10, 40, 60, 100, 500]) {
      const s = saturationFor(po2)
      expect(s, `po2 ${po2}`).toBeGreaterThanOrEqual(0)
      expect(s, `po2 ${po2}`).toBeLessThanOrEqual(100)
    }
  })

  it('gives roughly normal saturation at a normal oxygen tension', () => {
    // ~95-99 % at a PO2 around 90-100 mmHg.
    expect(saturationFor(95)).toBeGreaterThan(95)
    expect(saturationFor(95)).toBeLessThanOrEqual(100)
  })

  it('raises CO2 as ventilation falls', () => {
    expect(estimatedPaco2(3)).toBeGreaterThan(estimatedPaco2(6))
    expect(estimatedPaco2(10)).toBeLessThan(estimatedPaco2(6))
  })

  it('penalises oxygenation as the lung stiffens', () => {
    expect(shuntPenaltyFor(50)).toBe(0)
    expect(shuntPenaltyFor(20)).toBeGreaterThan(0)
    expect(shuntPenaltyFor(15)).toBeGreaterThan(shuntPenaltyFor(30))
  })
})

describe('target saturation', () => {
  const normal = { fio2: 40, minuteVolume: 6.3, compliance: 50 }

  it('rises with inspired oxygen', () => {
    expect(targetSpo2({ ...normal, fio2: 100 }))
      .toBeGreaterThanOrEqual(targetSpo2(normal))
  })

  it('falls when the lung is stiffer at the same FiO2', () => {
    expect(targetSpo2({ ...normal, compliance: 15 }))
      .toBeLessThan(targetSpo2(normal))
  })

  it('falls when ventilation is inadequate', () => {
    expect(targetSpo2({ ...normal, minuteVolume: 1.5 }))
      .toBeLessThan(targetSpo2(normal))
  })

  it('stays within a physiologically possible range', () => {
    for (const fio2 of [21, 40, 60, 100]) {
      for (const compliance of [15, 30, 50]) {
        const s = targetSpo2({ fio2, minuteVolume: 6, compliance })
        expect(s, `${fio2}/${compliance}`).toBeGreaterThanOrEqual(0)
        expect(s, `${fio2}/${compliance}`).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('saturation response', () => {
  it('adopts the target immediately when there is no previous value', () => {
    expect(stepSpo2(null, 96, 0.02)).toBe(96)
  })

  it('approaches the target rather than jumping to it', () => {
    const next = stepSpo2(90, 99, 1)
    expect(next).toBeGreaterThan(90)
    expect(next).toBeLessThan(99)
  })

  it('converges on the target over time', () => {
    let s = 85
    for (let i = 0; i < 300; i += 1) s = stepSpo2(s, 98, 1)
    expect(s).toBeCloseTo(98, 1)
  })
})
