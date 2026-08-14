import { pressureTargetStep, computeAirwayPressure, expiratoryAirwayPressure } from '../lungModel.js'
import { getBreathTiming } from './breathTiming.js'
import { musclePressure } from '../spontaneousEffort.js'

// Bi-level / DuoLevel, and APRV as the same mechanism at an extreme setting.
//
// The airway is held alternately at a high and a low pressure, and the
// patient may breathe spontaneously at either level. Ventilation comes from
// the transitions between the two levels rather than from discrete breaths.
//
// APRV is this with a long time at the high level and a very short release,
// so it is expressed here as a preset of the same mode rather than as
// separate code.

export function step({ state, settings, patient, dt }) {
  const { ti, te } = getBreathTiming(settings)
  const pHigh = settings.peep + (settings.pInsp ?? 15)
  const pLow = settings.peep
  const effort = settings.effort ?? { amplitude: 0, rate: 0 }

  let { phase, phaseElapsed, volume, effortElapsed } = state
  effortElapsed = (effortElapsed ?? 0) + dt

  const pmus = musclePressure({
    amplitude: effort.amplitude,
    rate: effort.rate,
    elapsed: effortElapsed,
  })

  let flow
  let breathComplete = false
  const atHigh = phase !== 'low'

  // Both levels are pressure targets; spontaneous effort adds to whichever
  // level is currently applied, which is what lets the patient breathe
  // through the cycle instead of only at the transitions.
  const target = (atHigh ? pHigh : pLow) + pmus
  const result = pressureTargetStep({
    volume,
    peep: settings.peep,
    targetPressure: target,
    compliance: patient.compliance,
    resistance: patient.resistance,
    dt,
  })
  volume = result.volume
  flow = result.flow

  const duration = atHigh ? ti : te
  if (phaseElapsed + dt >= duration) {
    phase = atHigh ? 'low' : 'high'
    phaseElapsed = 0
    if (!atHigh) breathComplete = true
  } else {
    phaseElapsed += dt
  }

  // Falling to the low level is a release: gas leaves, so the airway reads
  // the expiratory pressure rather than the equation of motion.
  const releasing = !atHigh && flow < 0
  const pressure = releasing
    ? expiratoryAirwayPressure({ flow, peep: settings.peep })
    : computeAirwayPressure({
      volume,
      flow,
      peep: settings.peep,
      compliance: patient.compliance,
      resistance: patient.resistance,
    }) - pmus

  return { phase, phaseElapsed, volume, flow, pressure, breathComplete, effortElapsed, pmus }
}

export const initialState = {
  phase: 'high',
  phaseElapsed: 0,
  volume: 0,
  flow: 0,
  pressure: 0,
  effortElapsed: 0,
  pmus: 0,
}
