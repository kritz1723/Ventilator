import { passiveExhaleStep, computeAirwayPressure, expiratoryAirwayPressure } from '../lungModel.js'
import { getBreathTiming } from './breathTiming.js'
import { inspiratoryFlow } from '../flowPatterns.js'
import { musclePressure, detectTrigger } from '../spontaneousEffort.js'

// Synchronised Intermittent Mandatory Ventilation.
//
// A set number of mandatory breaths are delivered per minute. Between them
// the patient may breathe spontaneously, and those breaths receive pressure
// support. A mandatory breath due within the synchronisation window is
// delivered on the patient's own effort rather than cutting across it,
// which is the synchronisation the mode is named for.

const SYNC_WINDOW_SECONDS = 0.5

export function step({ state, settings, patient, dt }) {
  const { ti } = getBreathTiming(settings)
  const mandatoryInterval = 60 / settings.respRate
  const support = settings.pSupport ?? 8
  const effort = settings.effort ?? { amplitude: 0, rate: 0 }
  const cycleOff = (settings.cycleOffPercent ?? 25) / 100

  let {
    phase, phaseElapsed, volume, effortElapsed,
    sinceMandatory, wasTriggering, peakInspFlow, breathKind,
  } = state

  effortElapsed = (effortElapsed ?? 0) + dt
  sinceMandatory = (sinceMandatory ?? 0) + dt

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

  if (phase === 'expiration') {
    const mandatoryDue = sinceMandatory >= mandatoryInterval
    const inSyncWindow = sinceMandatory >= mandatoryInterval - SYNC_WINDOW_SECONDS

    if (mandatoryDue || (triggered && inSyncWindow)) {
      // Mandatory breath, synchronised to the patient if they are ready.
      phase = 'inspiration'
      phaseElapsed = 0
      breathKind = 'mandatory'
      sinceMandatory = 0
      peakInspFlow = 0
    } else if (triggered) {
      // Spontaneous breath between mandatory breaths, pressure supported.
      phase = 'inspiration'
      phaseElapsed = 0
      breathKind = 'supported'
      peakInspFlow = 0
    }
  }

  if (phase === 'inspiration' && breathKind === 'mandatory') {
    flow = inspiratoryFlow({
      patternId: settings.flowPattern,
      x: ti > 0 ? phaseElapsed / ti : 1,
      tidalVolume: settings.tidalVolume,
      flowTime: ti,
    })
    volume += (flow / 60) * 1000 * dt
    if (phaseElapsed + dt >= ti) {
      phase = 'expiration'
      phaseElapsed = 0
    } else {
      phaseElapsed += dt
    }
  } else if (phase === 'inspiration') {
    const target = settings.peep + support
    const flowLps = (target + pmus - settings.peep - volume / patient.compliance) / patient.resistance
    flow = flowLps * 60
    volume = Math.max(volume + flowLps * dt * 1000, 0)
    peakInspFlow = Math.max(peakInspFlow ?? 0, flow)
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
    if (volume <= 1 && (state.volume ?? 0) > 1) breathComplete = true
  }

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
    phase, phaseElapsed, volume, flow, pressure, breathComplete,
    effortElapsed, sinceMandatory, wasTriggering: isTriggering,
    peakInspFlow, breathKind, pmus,
  }
}

export const initialState = {
  phase: 'expiration',
  phaseElapsed: 0,
  volume: 0,
  flow: 0,
  pressure: 0,
  effortElapsed: 0,
  sinceMandatory: 0,
  wasTriggering: false,
  peakInspFlow: 0,
  breathKind: null,
  pmus: 0,
}
