import { passiveExhaleStep, pressureTargetStep, computeAirwayPressure, expiratoryAirwayPressure } from '../lungModel.js'
import { getBreathTiming } from './breathTiming.js'

// Pressure Control: airway pressure is driven to (PEEP + set inspiratory
// pressure) and held for the inspiratory time; flow decelerates as the
// lung fills, then passive exhalation follows.
export function step({ state, settings, patient, dt }) {
  const { ti, te } = getBreathTiming(settings)
  const targetPressure = settings.peep + settings.pInsp

  let { phase, phaseElapsed, volume } = state
  let flow
  let breathComplete = false
  let expiring = false

  if (phase === 'inspiration') {
    const result = pressureTargetStep({
      volume,
      peep: settings.peep,
      targetPressure,
      compliance: patient.compliance,
      resistance: patient.resistance,
      dt,
    })
    volume = result.volume
    flow = result.flow
    if (phaseElapsed + dt >= ti) {
      phase = 'expiration'
      phaseElapsed = 0
    } else {
      phaseElapsed += dt
    }
  } else {
    expiring = true
    const result = passiveExhaleStep({ volume, compliance: patient.compliance, resistance: patient.resistance, dt })
    volume = result.volume
    // Already negative: expiratory flow sits below the baseline.
    flow = result.flow
    if (phaseElapsed + dt >= te) {
      phase = 'inspiration'
      phaseElapsed = 0
      breathComplete = true
    } else {
      phaseElapsed += dt
    }
  }

  const pressure = expiring
    ? expiratoryAirwayPressure({ flow, peep: settings.peep })
    : computeAirwayPressure({
      volume,
      flow,
      peep: settings.peep,
      compliance: patient.compliance,
      resistance: patient.resistance,
    })

  return { phase, phaseElapsed, volume, flow, pressure, breathComplete }
}

export const initialState = {
  phase: 'inspiration',
  phaseElapsed: 0,
  volume: 0,
  flow: 0,
  pressure: 0,
}
