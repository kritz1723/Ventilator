import { describe, it, expect } from 'vitest'
import {
  FEATURES, DEFAULT_LICENCE, TIER, LicenceError,
  isEnabled, setFeature, applyTier, licensedModes, resolveActiveMode,
} from '../src/config/licensing.js'
import { MODES, DEFAULT_MODE } from '../src/engine/ventilatorModes/index.js'

describe('optional features', () => {
  it('enables everything by default', () => {
    for (const f of Object.values(FEATURES)) {
      expect(isEnabled(DEFAULT_LICENCE, f.id), f.id).toBe(true)
    }
  })

  it('disables an optional feature when the licence withdraws it', () => {
    const licence = setFeature(DEFAULT_LICENCE, 'loops', false)
    expect(isEnabled(licence, 'loops')).toBe(false)
  })

  it('treats an unknown feature as unavailable', () => {
    expect(isEnabled(DEFAULT_LICENCE, 'nope')).toBe(false)
  })
})

describe('safety mandatory features', () => {
  const mandatory = Object.values(FEATURES).filter((f) => f.mandatory).map((f) => f.id)

  it('covers alarms, self tests, the event record and the core modes', () => {
    expect(mandatory).toEqual(expect.arrayContaining(['alarms', 'selfTests', 'eventLog', 'coreModes']))
  })

  it('rejects an attempt to disable one', () => {
    for (const id of mandatory) {
      expect(() => setFeature(DEFAULT_LICENCE, id, false), id).toThrow(LicenceError)
    }
  })

  it('stays enabled even if a licence claims otherwise', () => {
    // A malformed or tampered licence must not be able to switch off a
    // safety function.
    const tampered = Object.fromEntries(mandatory.map((id) => [id, false]))
    for (const id of mandatory) {
      expect(isEnabled(tampered, id), id).toBe(true)
    }
  })

  it('survives a tier that would otherwise exclude it', () => {
    const base = applyTier(DEFAULT_LICENCE, TIER.BASE)
    for (const id of mandatory) {
      expect(isEnabled(base, id), id).toBe(true)
    }
  })
})

describe('tiers', () => {
  it('base excludes advanced and premium features', () => {
    const licence = applyTier(DEFAULT_LICENCE, TIER.BASE)
    expect(isEnabled(licence, 'adaptiveModes')).toBe(false)
    expect(isEnabled(licence, 'biLevelModes')).toBe(false)
  })

  it('advanced includes advanced but not premium', () => {
    const licence = applyTier(DEFAULT_LICENCE, TIER.ADVANCED)
    expect(isEnabled(licence, 'adaptiveModes')).toBe(true)
    expect(isEnabled(licence, 'biLevelModes')).toBe(false)
  })

  it('premium includes everything', () => {
    const licence = applyTier(DEFAULT_LICENCE, TIER.PREMIUM)
    for (const f of Object.values(FEATURES)) {
      expect(isEnabled(licence, f.id), f.id).toBe(true)
    }
  })
})

describe('mode gating', () => {
  it('removes a mode from the registry when its feature is disabled', () => {
    const licence = setFeature(DEFAULT_LICENCE, 'biLevelModes', false)
    const available = licensedModes(licence, MODES)
    expect(available.BILEVEL).toBeUndefined()
    expect(available.APRV).toBeUndefined()
    expect(available[DEFAULT_MODE]).toBeDefined()
  })

  it('always leaves the core modes available', () => {
    const licence = applyTier(DEFAULT_LICENCE, TIER.BASE)
    const available = licensedModes(licence, MODES)
    expect(available['VC-CMV']).toBeDefined()
    expect(available['PC-CMV']).toBeDefined()
  })

  it('falls back when the active mode loses its licence', () => {
    const licence = setFeature(DEFAULT_LICENCE, 'biLevelModes', false)
    expect(resolveActiveMode(licence, MODES, 'APRV', DEFAULT_MODE)).toBe(DEFAULT_MODE)
  })

  it('keeps the active mode when it remains licensed', () => {
    expect(resolveActiveMode(DEFAULT_LICENCE, MODES, 'APRV', DEFAULT_MODE)).toBe('APRV')
  })

  it('never resolves to an unlicensed mode', () => {
    const licence = applyTier(DEFAULT_LICENCE, TIER.BASE)
    const resolved = resolveActiveMode(licence, MODES, 'PRVC', DEFAULT_MODE)
    expect(licensedModes(licence, MODES)[resolved]).toBeDefined()
  })
})
