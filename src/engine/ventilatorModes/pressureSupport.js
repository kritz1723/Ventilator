import { passiveExhaleStep, computeAirwayPressure, expiratoryAirwayPressure } from '../lungModel.js'
import { musclePressure, detectTrigger } from '../spontaneousEffort.js'

// Pressure Support / CPAP.
//
// Every breath is triggered by the patient. Support pressure is applied on
// trigger and held until inspiratory flow decays to a set fraction of its
// peak — flow cycling — rather than for a fixed time. With the support set
// to zero this is CPAP: the patient breathes on a constant baseline.
//
// An apnea backup breath is delivered if no effort is detected within the
// apnea interval, which is what makes the mode safe to leave a patient in.

const APNEA_BACKUP_SECONDS = 12

export function step({ state, settings, patient, dt }) {
  const support = settings.pSupport ?? 0
  const cycleOff = (settings.cycleOffPercent ?? 25) / 100
  const effort = settings.effort ?? { amplitude: 0, rate: 0 }

  let {
    phase, phaseElapsed, volume, effortElapsed,
    wasTriggering, peakInspFlow, sinceLastBreath,
  } = state

  effortElapsed = (effortElapsed ?? 0) + dt
  sinceLastBreath = (sinceLastBreath ?? 0) + dt

  const pmus = musclePressure({
    amplitude: effort.amplitude,
    rate: effort.rate,
    elapsed: effortElapsed,
  })

  const { triggered, isTriggering } = detectTrigger({
    wasTriggering: wasTriggering ?? false,
    pmus,
    resistance: patient.resistance,
    triggerSensitivity: settings.triggerFlow ?? 2,
  })

  let flow
  let breathComplete = false
  let expiring = false
  let backupBreath = false

  if (phase === 'expiration') {
    // Patient effort, or the apnea backup, starts a supported breath.
    if (triggered || sinceLastBreath >= APNEA_BACKUP_SECONDS) {
      backupBreath = !triggered
      phase = 'inspiration'
      phaseElapsed = 0
      peakInspFlow = 0
      sinceLastBreath = 0
    }
  }

  if (phase === 'inspiration') {
    // Ventilator support and patient effort both drive gas in.
    const target = settings.peep + support
    const flowLps = (target + pmus - settings.peep - volume / patient.compliance) / patient.resistance
    flow = flowLps * 60
    volume = Math.max(volume + flowLps * dt * 1000, 0)
    peakInspFlow = Math.max(peakInspFlow ?? 0, flow)

    // Flow cycling: end inspiration once flow falls to the set fraction of
    // its peak. A time limit bounds the breath if flow never decays.
    const cycled = peakInspFlow > 0 && flow <= peakInspFlow * cycleOff
    if (cycled || phaseElapsed + dt >= 3) {
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
    flow = result.flow
    phaseElapsed += dt
    if (result.volume <= 0.5 && !breathComplete) breathComplete = false
  }

  // A breath is counted complete when expiration has emptied the lung.
  if (expiring && volume <= 1 && (state.volume ?? 0) > 1) breathComplete = true

  const pressure = expiring
    ? expiratoryAirwayPressure({ flow, peep: settings.peep })
    : computeAirwayPressure({
      volume,
      flow,
      peep: settings.peep,
      compliance: patient.compliance,
      resistance: patient.resistance,
    }) - pmus

  return {
    phase,
    phaseElapsed,
    volume,
    flow,
    pressure,
    breathComplete,
    effortElapsed,
    wasTriggering: isTriggering,
    peakInspFlow,
    sinceLastBreath,
    pmus,
    backupBreath,
  }
}

export const initialState = {
  phase: 'expiration',
  phaseElapsed: 0,
  volume: 0,
  flow: 0,
  pressure: 0,
  effortElapsed: 0,
  wasTriggering: false,
  peakInspFlow: 0,
  sinceLastBreath: 0,
  pmus: 0,
}
