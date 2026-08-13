import { describe, it, expect } from 'vitest'
import { computeAirwayPressure, passiveExhaleStep, pressureTargetStep } from '../src/engine/lungModel.js'

describe('computeAirwayPressure', () => {
  it('equals PEEP when volume and flow are zero', () => {
    expect(computeAirwayPressure({ volume: 0, flow: 0, peep: 5, compliance: 50, resistance: 10 })).toBe(5)
  })

  it('adds the elastic (volume/compliance) component', () => {
    const p = computeAirwayPressure({ volume: 500, flow: 0, peep: 5, compliance: 50, resistance: 10 })
    expect(p).toBeCloseTo(5 + 500 / 50, 6)
  })

  it('adds the resistive (flow * resistance) component', () => {
    // 60 L/min == 1 L/s
    const p = computeAirwayPressure({ volume: 0, flow: 60, peep: 5, compliance: 50, resistance: 10 })
    expect(p).toBeCloseTo(5 + 1 * 10, 6)
  })

  it('lower compliance (stiffer lung) yields higher pressure for the same volume', () => {
    const normal = computeAirwayPressure({ volume: 500, flow: 0, peep: 5, compliance: 50, resistance: 10 })
    const ards = computeAirwayPressure({ volume: 500, flow: 0, peep: 5, compliance: 25, resistance: 10 })
    expect(ards).toBeGreaterThan(normal)
  })
})

describe('passiveExhaleStep', () => {
  it('decays volume toward zero over time', () => {
    let volume = 500
    for (let i = 0; i < 100; i += 1) {
      const result = passiveExhaleStep({ volume, compliance: 50, resistance: 10, dt: 0.02 })
      volume = result.volume
    }
    expect(volume).toBeLessThan(500)
    expect(volume).toBeGreaterThanOrEqual(0)
  })

  it('returns zero flow once volume reaches zero', () => {
    const result = passiveExhaleStep({ volume: 0, compliance: 50, resistance: 10, dt: 0.02 })
    expect(result.volume).toBe(0)
    expect(result.flow).toBe(0)
  })

  it('higher resistance slows the exhalation time constant', () => {
    const low = passiveExhaleStep({ volume: 500, compliance: 50, resistance: 5, dt: 0.02 })
    const high = passiveExhaleStep({ volume: 500, compliance: 50, resistance: 20, dt: 0.02 })
    // With higher resistance, less volume is exhaled in the same dt.
    expect(high.volume).toBeGreaterThan(low.volume)
  })
})

describe('pressureTargetStep', () => {
  it('flow is zero once volume reaches equilibrium with target pressure', () => {
    const compliance = 50
    const peep = 5
    const targetPressure = 25
    const equilibriumVolume = (targetPressure - peep) * compliance
    const result = pressureTargetStep({
      volume: equilibriumVolume,
      peep,
      targetPressure,
      compliance,
      resistance: 10,
      dt: 0.02,
    })
    expect(result.flow).toBeCloseTo(0, 6)
  })

  it('flow decelerates as volume approaches equilibrium', () => {
    const args = { peep: 5, targetPressure: 25, compliance: 50, resistance: 10, dt: 0.02 }
    const early = pressureTargetStep({ volume: 0, ...args })
    const later = pressureTargetStep({ volume: 500, ...args })
    expect(later.flow).toBeLessThan(early.flow)
  })
})

describe('flow sign convention', () => {
  it('passiveExhaleStep reports exhaled flow as negative', () => {
    const result = passiveExhaleStep({ volume: 500, compliance: 50, resistance: 10, dt: 0.02 })
    expect(result.flow).toBeLessThan(0)
  })
})
