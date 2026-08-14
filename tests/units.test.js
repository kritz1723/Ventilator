import { describe, it, expect } from 'vitest'
import {
  QUANTITY, UNIT_SYSTEMS, DEFAULT_UNITS,
  toDisplay, toCanonical, format, unitLabel, setUnit, unitFor,
} from '../src/config/units.js'

describe('canonical defaults', () => {
  it('defaults every quantity to its canonical unit', () => {
    for (const [q, sys] of Object.entries(UNIT_SYSTEMS)) {
      expect(DEFAULT_UNITS[q], q).toBe(sys.canonical)
    }
  })

  it('leaves a value unchanged in its canonical unit', () => {
    expect(toDisplay(20, DEFAULT_UNITS, QUANTITY.PRESSURE)).toBe(20)
    expect(toDisplay(450, DEFAULT_UNITS, QUANTITY.VOLUME)).toBe(450)
  })

  it('gives every canonical unit a factor of exactly one', () => {
    for (const sys of Object.values(UNIT_SYSTEMS)) {
      expect(sys.options[sys.canonical].factor).toBe(1)
    }
  })
})

describe('conversion', () => {
  it('converts pressure to hPa', () => {
    const units = setUnit(DEFAULT_UNITS, QUANTITY.PRESSURE, 'hPa')
    expect(toDisplay(20, units, QUANTITY.PRESSURE)).toBeCloseTo(19.6133, 3)
  })

  it('converts volume to litres', () => {
    const units = setUnit(DEFAULT_UNITS, QUANTITY.VOLUME, 'L')
    expect(toDisplay(450, units, QUANTITY.VOLUME)).toBeCloseTo(0.45, 6)
  })

  it('converts height to inches', () => {
    const units = setUnit(DEFAULT_UNITS, QUANTITY.LENGTH, 'in')
    expect(toDisplay(180, units, QUANTITY.LENGTH)).toBeCloseTo(70.866, 2)
  })

  it('converts weight to pounds', () => {
    const units = setUnit(DEFAULT_UNITS, QUANTITY.WEIGHT, 'lb')
    expect(toDisplay(70, units, QUANTITY.WEIGHT)).toBeCloseTo(154.32, 1)
  })

  it('treats hPa and mbar as numerically equal', () => {
    const hpa = setUnit(DEFAULT_UNITS, QUANTITY.PRESSURE, 'hPa')
    const mbar = setUnit(DEFAULT_UNITS, QUANTITY.PRESSURE, 'mbar')
    expect(toDisplay(30, hpa, QUANTITY.PRESSURE))
      .toBeCloseTo(toDisplay(30, mbar, QUANTITY.PRESSURE), 9)
  })
})

describe('round trip', () => {
  // Verifies conversion happens once, at display. A value that does not
  // return to itself would indicate conversion applied more than once.
  it('returns to the original value for every unit of every quantity', () => {
    for (const [quantity, sys] of Object.entries(UNIT_SYSTEMS)) {
      for (const unitId of Object.keys(sys.options)) {
        const units = setUnit(DEFAULT_UNITS, quantity, unitId)
        const original = 37.5
        const there = toDisplay(original, units, quantity)
        const back = toCanonical(there, units, quantity)
        expect(back, `${quantity}/${unitId}`).toBeCloseTo(original, 9)
      }
    }
  })
})

describe('formatting', () => {
  it('always carries the unit in force', () => {
    expect(format(20, DEFAULT_UNITS, QUANTITY.PRESSURE)).toBe('20 cmH₂O')
    const units = setUnit(DEFAULT_UNITS, QUANTITY.PRESSURE, 'hPa')
    expect(format(20, units, QUANTITY.PRESSURE)).toBe('19.6 hPa')
  })

  it('renders a missing value as a placeholder that still names the unit', () => {
    expect(format(null, DEFAULT_UNITS, QUANTITY.PRESSURE)).toBe('–– cmH₂O')
    expect(format(Number.NaN, DEFAULT_UNITS, QUANTITY.VOLUME)).toBe('–– mL')
  })

  it('can omit the unit when the caller renders it separately', () => {
    expect(format(20, DEFAULT_UNITS, QUANTITY.PRESSURE, { withUnit: false })).toBe('20')
  })

  it('uses a precision appropriate to the unit', () => {
    const litres = setUnit(DEFAULT_UNITS, QUANTITY.VOLUME, 'L')
    expect(format(450, litres, QUANTITY.VOLUME)).toBe('0.450 L')
    expect(format(450, DEFAULT_UNITS, QUANTITY.VOLUME)).toBe('450 mL')
  })
})

describe('robustness', () => {
  it('falls back to the canonical unit for an unknown selection', () => {
    expect(unitLabel({ pressure: 'nonsense' }, QUANTITY.PRESSURE)).toBe('cmH₂O')
  })

  it('ignores an attempt to set an unsupported unit', () => {
    const units = setUnit(DEFAULT_UNITS, QUANTITY.PRESSURE, 'furlongs')
    expect(units[QUANTITY.PRESSURE]).toBe('cmH2O')
  })

  it('returns null rather than a misleading zero for a missing value', () => {
    expect(toDisplay(null, DEFAULT_UNITS, QUANTITY.PRESSURE)).toBeNull()
    expect(toCanonical(null, DEFAULT_UNITS, QUANTITY.PRESSURE)).toBeNull()
  })

  it('resolves a unit for every quantity', () => {
    for (const q of Object.values(QUANTITY)) {
      expect(unitFor(DEFAULT_UNITS, q), q).toBeTruthy()
    }
  })
})
