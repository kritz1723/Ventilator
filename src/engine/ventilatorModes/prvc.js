import { passiveExhaleStep, pressureTargetStep, computeAirwayPressure, expiratoryAirwayPressure } from '../lungModel.js'
import { getBreathTiming } from './breathTiming.js'

// Pressure Regulated Volume Control: breaths are pressure-controlled, but
// the inspiratory pressure is adjusted breath to breath so the delivered
// volume converges on the target tidal volume. The adjustment is limited
// per breath, and the resulting pressure is capped, which is what gives the
// mode its characteristic slow approach to target.
const MAX_STEP_PER_BREATH = 3 // cmH2O
const MIN_DRIVING = 3
const MAX_DRIVING = 35

export function step({ state, settings, patient, dt }) {
  const { ti, te } = getBreathTiming(settings)

  let { phase, phaseElapsed, volume, targetDriving, deliveredPeak } = state
  if (targetDriving == null) targetDriving = settings.pInsp
  if (deliveredPeak == null) deliveredPeak = 0

  const targetPressure = settings.peep + targetDriving
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
    deliveredPeak = Math.max(deliveredPeak, volume)
    if (phaseElapsed + dt >= ti) {
      phase = 'expiration'
      phaseElapsed = 0
    } else {
      phaseElapsed += dt
    }
  } else {
    expiring = true
    const result = passiveExhaleStep({
      volume, compliance: patient.compliance, resistance: patient.resistance, dt,
    })
    volume = result.volume
    // Already negative: expiratory flow sits below the baseline.
    flow = result.flow
    if (phaseElapsed + dt >= te) {
      // Adapt the pressure target using the volume the last breath achieved.
      const error = settings.tidalVolume - deliveredPeak
      const complianceEstimate = Math.max(patient.compliance, 1)
      const correction = Math.max(
        -MAX_STEP_PER_BREATH,
        Math.min(MAX_STEP_PER_BREATH, error / complianceEstimate),
      )
      targetDriving = Math.max(MIN_DRIVING, Math.min(MAX_DRIVING, targetDriving + correction))
      deliveredPeak = 0
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

  return { phase, phaseElapsed, volume, flow, pressure, breathComplete, targetDriving, deliveredPeak }
}

export const initialState = {
  phase: 'inspiration',
  phaseElapsed: 0,
  volume: 0,
  flow: 0,
  pressure: 0,
  targetDriving: null,
  deliveredPeak: 0,
}
