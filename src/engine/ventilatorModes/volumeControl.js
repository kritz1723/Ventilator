import { passiveExhaleStep, computeAirwayPressure } from '../lungModel.js'
import { getBreathTiming } from './breathTiming.js'
import { inspiratoryFlow } from '../flowPatterns.js'

// Volume Control: the set tidal volume is delivered over the inspiratory
// flow time using the selected flow pattern, optionally followed by an
// end-inspiratory pause (which reveals plateau pressure), then passive
// exhalation.
export function step({ state, settings, patient, dt }) {
  const { ti, te } = getBreathTiming(settings)
  const pauseTime = Math.min(settings.pauseTime ?? 0, ti * 0.5)
  const flowTime = ti - pauseTime

  let { phase, phaseElapsed, volume } = state
  let flow
  let breathComplete = false

  if (phase === 'inspiration-flow') {
    flow = inspiratoryFlow({
      patternId: settings.flowPattern,
      x: flowTime > 0 ? phaseElapsed / flowTime : 1,
      tidalVolume: settings.tidalVolume,
      flowTime,
    })
    volume += (flow / 60) * 1000 * dt
    if (phaseElapsed + dt >= flowTime) {
      phase = pauseTime > 0 ? 'inspiration-pause' : 'expiration'
      phaseElapsed = 0
    } else {
      phaseElapsed += dt
    }
  } else if (phase === 'inspiration-pause') {
    flow = 0
    if (phaseElapsed + dt >= pauseTime) {
      phase = 'expiration'
      phaseElapsed = 0
    } else {
      phaseElapsed += dt
    }
  } else {
    const result = passiveExhaleStep({
      volume, compliance: patient.compliance, resistance: patient.resistance, dt,
    })
    volume = result.volume
    // Exhaled flow is displayed as negative (below the zero-flow baseline).
    flow = -result.flow
    if (phaseElapsed + dt >= te) {
      phase = 'inspiration-flow'
      phaseElapsed = 0
      breathComplete = true
    } else {
      phaseElapsed += dt
    }
  }

  const pressure = computeAirwayPressure({
    volume,
    flow,
    peep: settings.peep,
    compliance: patient.compliance,
    resistance: patient.resistance,
  })

  return { phase, phaseElapsed, volume, flow, pressure, breathComplete }
}

export const initialState = {
  phase: 'inspiration-flow',
  phaseElapsed: 0,
  volume: 0,
  flow: 0,
  pressure: 0,
}
