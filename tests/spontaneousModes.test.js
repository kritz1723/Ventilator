import { describe, it, expect } from 'vitest'
import { musclePressure, triggerFlow, detectTrigger, EFFORT_PRESETS } from '../src/engine/spontaneousEffort.js'
import { MODES } from '../src/engine/ventilatorModes/index.js'

describe('musclePressure', () => {
  it('is zero with no effort', () => {
    expect(musclePressure({ amplitude: 0, rate: 15, elapsed: 0.5 })).toBe(0)
  })

  it('rises and falls within neural inspiration and rests afterwards', () => {
    const args = { amplitude: 10, rate: 15 } // 4 s cycle, 1.6 s neural Ti
    expect(musclePressure({ ...args, elapsed: 0.8 })).toBeGreaterThan(0)
    expect(musclePressure({ ...args, elapsed: 2.5 })).toBe(0)
  })

  it('never generates a positive assist beyond the set amplitude', () => {
    const args = { amplitude: 8, rate: 15 }
    for (let t = 0; t < 8; t += 0.02) {
      expect(musclePressure({ ...args, elapsed: t })).toBeLessThanOrEqual(8 + 1e-9)
    }
  })

  it('repeats at the patient rate', () => {
    const args = { amplitude: 10, rate: 15 } // 4 s cycle
    expect(musclePressure({ ...args, elapsed: 0.8 }))
      .toBeCloseTo(musclePressure({ ...args, elapsed: 4.8 }), 6)
  })
})

describe('trigger detection', () => {
  it('does not trigger below the sensitivity', () => {
    expect(detectTrigger({ wasTriggering: false, pmus: 0.1, resistance: 10, triggerSensitivity: 5 }).triggered)
      .toBe(false)
  })

  it('triggers once on the rising edge, not while the effort persists', () => {
    const args = { pmus: 5, resistance: 10, triggerSensitivity: 2 }
    const first = detectTrigger({ wasTriggering: false, ...args })
    expect(first.triggered).toBe(true)
    const second = detectTrigger({ wasTriggering: first.isTriggering, ...args })
    expect(second.triggered).toBe(false)
  })

  it('draws more flow for a stronger effort', () => {
    expect(triggerFlow({ pmus: 10, resistance: 10 }))
      .toBeGreaterThan(triggerFlow({ pmus: 4, resistance: 10 }))
  })
})

const patient = { compliance: 50, resistance: 10 }
const dt = 0.02
const baseSettings = {
  respRate: 12, ieRatio: [1, 2], tidalVolume: 500, pInsp: 15, peep: 5,
  pauseTime: 0.2, flowPattern: 'square', pSupport: 10, cycleOffPercent: 25,
  triggerFlow: 2, effort: EFFORT_PRESETS.normal,
}

function run(mode, settings, steps = 1500) {
  let state = mode.initialState
  const out = []
  for (let i = 0; i < steps; i += 1) {
    state = mode.step({ state, settings, patient, dt })
    out.push(state)
  }
  return out
}

describe.each([
  ['VC-SIMV', MODES['VC-SIMV']],
  ['PSV', MODES.PSV],
  ['BiLevel', MODES.BILEVEL],
  ['APRV', MODES.APRV],
])('%s', (_name, entry) => {
  const states = run(entry.impl, baseSettings)

  it('delivers volume to the lung', () => {
    expect(Math.max(...states.map((s) => s.volume))).toBeGreaterThan(50)
  })

  it('keeps airway pressure at or above PEEP', () => {
    expect(Math.min(...states.map((s) => s.pressure))).toBeGreaterThanOrEqual(baseSettings.peep - 1e-6)
  })

  it('produces both inspiratory and expiratory flow', () => {
    expect(states.some((s) => s.flow > 0)).toBe(true)
    expect(states.some((s) => s.flow < 0)).toBe(true)
  })
})

describe('PSV apnea backup', () => {
  it('still delivers breaths when the patient makes no effort', () => {
    const states = run(MODES.PSV.impl, { ...baseSettings, effort: EFFORT_PRESETS.none }, 2000)
    expect(Math.max(...states.map((s) => s.volume))).toBeGreaterThan(50)
  })
})

describe('CPAP', () => {
  it('delivers no support pressure above PEEP when support is zero', () => {
    const states = run(MODES.PSV.impl, { ...baseSettings, pSupport: 0 }, 1000)
    const maxAbovePeep = Math.max(...states.map((s) => s.pressure)) - baseSettings.peep
    expect(maxAbovePeep).toBeLessThan(3)
  })
})

describe('mode registry', () => {
  it('excludes vendor-proprietary algorithms', () => {
    const ids = Object.keys(MODES).join(' ').toUpperCase()
    for (const proprietary of ['NAVA', 'PAV', 'ASV', 'INTELLIVENT']) {
      expect(ids).not.toContain(proprietary)
    }
  })

  it('exposes step and initialState for every mode', () => {
    for (const [id, m] of Object.entries(MODES)) {
      expect(typeof m.impl.step, id).toBe('function')
      expect(m.impl.initialState, id).toBeDefined()
    }
  })
})
