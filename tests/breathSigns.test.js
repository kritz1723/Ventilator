import { describe, it, expect } from 'vitest'
import * as volumeControl from '../src/engine/ventilatorModes/volumeControl.js'
import * as pressureControl from '../src/engine/ventilatorModes/pressureControl.js'
import * as prvc from '../src/engine/ventilatorModes/prvc.js'

const settings = {
  respRate: 12,
  ieRatio: [1, 2],
  tidalVolume: 500,
  pInsp: 15,
  peep: 5,
  pauseTime: 0.2,
  flowPattern: 'square',
}
const patient = { compliance: 50, resistance: 10 }
const dt = 0.02

// Run a mode for two full breaths and collect the sign of flow in each phase.
function runBreaths(mode) {
  let state = mode.initialState
  const inspFlows = []
  const expFlows = []
  for (let i = 0; i < 1000; i += 1) {
    const prevPhase = state.phase
    state = mode.step({ state, settings, patient, dt })
    if (prevPhase.startsWith('inspiration') && state.flow !== 0) inspFlows.push(state.flow)
    if (prevPhase === 'expiration' && state.flow !== 0) expFlows.push(state.flow)
  }
  return { inspFlows, expFlows }
}

describe.each([
  ['volume control', volumeControl],
  ['pressure control', pressureControl],
  ['PRVC', prvc],
])('%s flow sign', (_name, mode) => {
  const { inspFlows, expFlows } = runBreaths(mode)

  it('draws inspiratory flow above the baseline', () => {
    expect(inspFlows.length).toBeGreaterThan(0)
    expect(inspFlows.every((f) => f > 0)).toBe(true)
  })

  it('draws expiratory flow below the baseline', () => {
    expect(expFlows.length).toBeGreaterThan(0)
    expect(expFlows.every((f) => f < 0)).toBe(true)
  })
})

describe.each([
  ['volume control', volumeControl],
  ['pressure control', pressureControl],
  ['PRVC', prvc],
])('%s airway pressure', (_name, mode) => {
  it('never falls below PEEP during expiration', () => {
    let state = mode.initialState
    const expPressures = []
    for (let i = 0; i < 1000; i += 1) {
      const prevPhase = state.phase
      state = mode.step({ state, settings, patient, dt })
      if (prevPhase === 'expiration') expPressures.push(state.pressure)
    }
    expect(expPressures.length).toBeGreaterThan(0)
    expect(Math.min(...expPressures)).toBeGreaterThanOrEqual(settings.peep - 1e-9)
  })

  it('decays back to PEEP during expiration', () => {
    let state = mode.initialState
    const expPressures = []
    for (let i = 0; i < 1000; i += 1) {
      const prev = state
      state = mode.step({ state, settings, patient, dt })
      // Sample only ticks that both started and ended in expiration; the
      // transition tick has already recomputed pressure for inspiration.
      if (prev.phase === 'expiration' && state.phase === 'expiration') {
        expPressures.push(state.pressure)
      }
    }
    expect(expPressures.length).toBeGreaterThan(0)
    // Once the lung has emptied, flow ceases and the airway sits at PEEP.
    expect(Math.min(...expPressures)).toBeLessThan(settings.peep + 0.5)
  })
})
