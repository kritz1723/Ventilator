import { useCallback, useEffect, useRef, useState } from 'react'
import { SimClock } from '../engine/clock.js'
import { MODES, DEFAULT_MODE } from '../engine/ventilatorModes/index.js'
import { getBreathTiming } from '../engine/ventilatorModes/breathTiming.js'
import { evaluateAlarms } from '../engine/alarms.js'
import { computeMeasurements } from '../engine/measurements.js'
import { MANEUVER, HOLD_DURATION_SECONDS, maneuverResult } from '../engine/maneuvers.js'
import { EFFORT_PRESETS, DEFAULT_EFFORT } from '../engine/spontaneousEffort.js'
import { targetSpo2, stepSpo2 } from '../engine/oxygenation.js'

const SAMPLE_HZ = 50
// Buffer the longest selectable sweep; the display slices the tail it needs,
// so changing sweep length never leaves a partly filled trace.
const MAX_WAVEFORM_SECONDS = 30
export const BUFFER_LENGTH = MAX_WAVEFORM_SECONDS * SAMPLE_HZ
export { SAMPLE_HZ }

const INSPIRATION_PHASES = new Set(['inspiration-flow', 'inspiration-pause', 'inspiration'])

function labelFor(type) {
  return type === MANEUVER.INSPIRATORY_HOLD ? 'Inspiratory hold' : 'Expiratory hold'
}

function createEmptyBuffer(peep = 0) {
  return Array.from({ length: BUFFER_LENGTH }, () => ({
    pressure: peep, flow: 0, volume: 0, alveolar: peep,
  }))
}

function emptyNumerics(peep) {
  return {
    peakPressure: peep,
    plateauPressure: peep,
    meanPressure: peep,
    peep,
    peakFlow: 0,
    tidalVolumeDelivered: 0,
    tidalVolumeExhaled: 0,
    measuredRR: 0,
    minuteVolume: 0,
  }
}

const emptyMeasurements = {
  cstat: null, cdyn: null, rinsp: null, drivingPressure: null,
  timeConstant: null, rsbi: null, mechanicalPower: null,
  ti: null, te: null, ieRatio: null,
}

// Drives the simulation clock, steps the active ventilator mode against the
// lung model each tick, and derives the waveform buffer, breath loop,
// numerics and mechanics the UI reads. The fixed-step physics runs inside
// refs (not React state) so integration is unaffected by render timing.
export function useVentilatorEngine({ settings, patient, ventilating, technical, deliveredFio2 }) {
  const [waveform, setWaveform] = useState(() => createEmptyBuffer(settings.peep))
  const [loop, setLoop] = useState([])
  const [numerics, setNumerics] = useState(() => emptyNumerics(settings.peep))
  const [measurements, setMeasurements] = useState(emptyMeasurements)
  const [alarms, setAlarms] = useState([])
  const [spo2, setSpo2] = useState(null)
  const [maneuver, setManeuver] = useState(null)

  const maneuverRef = useRef(null)
  const pendingManeuverRef = useRef(null)
  const maneuverElapsedRef = useRef(0)
  const spo2Ref = useRef(null)
  const fio2Ref = useRef(settings.fio2)
  fio2Ref.current = deliveredFio2 ?? settings.fio2
  const settingsRef = useRef(settings)
  const patientRef = useRef(patient)
  const technicalRef = useRef(technical)
  settingsRef.current = settings
  patientRef.current = patient
  technicalRef.current = technical

  const modeStateRef = useRef(MODES[settings.mode]?.impl.initialState ?? MODES[DEFAULT_MODE].impl.initialState)
  const bufferRef = useRef(createEmptyBuffer(settings.peep))
  const breathSamplesRef = useRef([])
  const timeRef = useRef(0)
  const breathPeakRef = useRef(settings.peep)
  const plateauRef = useRef(settings.peep)
  const pressureSumRef = useRef(0)
  const pressureCountRef = useRef(0)
  const peakFlowRef = useRef(0)
  const deliveredVolumeRef = useRef(0)
  const lastBreathTimeRef = useRef(0)
  const breathIntervalsRef = useRef([])
  const activeModeRef = useRef(settings.mode)

  const resetBreathTracking = useCallback(() => {
    breathPeakRef.current = settingsRef.current.peep
    plateauRef.current = settingsRef.current.peep
    pressureSumRef.current = 0
    pressureCountRef.current = 0
    peakFlowRef.current = 0
    deliveredVolumeRef.current = 0
  }, [])

  // Restart the mode state machine when the mode changes.
  useEffect(() => {
    if (activeModeRef.current !== settings.mode) {
      activeModeRef.current = settings.mode
      modeStateRef.current = MODES[settings.mode]?.impl.initialState
        ?? MODES[DEFAULT_MODE].impl.initialState
      breathSamplesRef.current = []
      resetBreathTracking()
      lastBreathTimeRef.current = timeRef.current
    }
  }, [settings.mode, resetBreathTracking])

  const engageHold = useCallback((type, volume) => {
    pendingManeuverRef.current = null
    maneuverRef.current = type
    maneuverElapsedRef.current = 0
    setManeuver(maneuverResult({
      type,
      volume,
      compliance: patientRef.current.compliance,
      peep: settingsRef.current.peep,
    }))
  }, [])

  const tick = useCallback((dt) => {
    const activeSettings = settingsRef.current

    // While a hold is active both valves are shut: no flow, and airway
    // pressure equilibrates with alveolar pressure.
    if (maneuverRef.current) {
      const held = modeStateRef.current
      const pressure = activeSettings.peep + held.volume / patientRef.current.compliance
      // No flow during a hold, so airway and alveolar pressure are equal.
      const sample = { pressure, flow: 0, volume: held.volume, alveolar: pressure }
      const buf = bufferRef.current
      buf.push(sample)
      if (buf.length > BUFFER_LENGTH) buf.shift()

      maneuverElapsedRef.current += dt
      timeRef.current += dt
      lastBreathTimeRef.current += dt // a hold is not an apnea

      if (maneuverElapsedRef.current >= HOLD_DURATION_SECONDS) {
        maneuverRef.current = null
        maneuverElapsedRef.current = 0
      }
      return
    }

    const impl = (MODES[activeModeRef.current] ?? MODES[DEFAULT_MODE]).impl
    // Modes read the resolved effort object rather than the preset id.
    const resolvedSettings = {
      ...activeSettings,
      effort: EFFORT_PRESETS[activeSettings.effort] ?? EFFORT_PRESETS[DEFAULT_EFFORT],
    }
    const result = impl.step({
      state: modeStateRef.current,
      settings: resolvedSettings,
      patient: patientRef.current,
      dt,
    })
    const wasInspiring = INSPIRATION_PHASES.has(modeStateRef.current.phase)
    modeStateRef.current = result
    timeRef.current += dt

    // Engage a pending hold at the phase boundary where its reading is
    // meaningful: end inspiration for a plateau, end expiration for total
    // PEEP. Until then the request simply waits.
    if (pendingManeuverRef.current === MANEUVER.INSPIRATORY_HOLD
        && wasInspiring && result.phase === 'expiration') {
      engageHold(MANEUVER.INSPIRATORY_HOLD, Math.max(result.volume, deliveredVolumeRef.current))
    } else if (pendingManeuverRef.current === MANEUVER.EXPIRATORY_HOLD && result.breathComplete) {
      engageHold(MANEUVER.EXPIRATORY_HOLD, result.volume)
    }

    pressureSumRef.current += result.pressure
    pressureCountRef.current += 1
    peakFlowRef.current = Math.max(peakFlowRef.current, result.flow)

    if (INSPIRATION_PHASES.has(result.phase)) {
      breathPeakRef.current = Math.max(breathPeakRef.current, result.pressure)
      deliveredVolumeRef.current = Math.max(deliveredVolumeRef.current, result.volume)
      if (result.phase === 'inspiration-pause' || result.flow === 0) {
        plateauRef.current = result.pressure
      }
    }

    const sample = {
      pressure: result.pressure,
      flow: result.flow,
      volume: result.volume,
      // Alveolar pressure is the recoil of the gas held above the baseline;
      // it differs from the airway reading by the resistive drop.
      alveolar: activeSettings.peep + result.volume / patientRef.current.compliance,
    }
    breathSamplesRef.current.push(sample)

    if (result.breathComplete) {
      const interval = timeRef.current - lastBreathTimeRef.current
      lastBreathTimeRef.current = timeRef.current
      breathIntervalsRef.current = [...breathIntervalsRef.current, interval].slice(-6)

      const avgInterval = breathIntervalsRef.current.reduce((a, b) => a + b, 0)
        / breathIntervalsRef.current.length
      const measuredRR = avgInterval > 0 ? 60 / avgInterval : 0
      const vte = deliveredVolumeRef.current
      const peak = breathPeakRef.current
      const plateau = plateauRef.current
      const mean = pressureCountRef.current > 0
        ? pressureSumRef.current / pressureCountRef.current
        : activeSettings.peep

      setNumerics({
        peakPressure: peak,
        plateauPressure: plateau,
        meanPressure: mean,
        peep: activeSettings.peep,
        peakFlow: peakFlowRef.current,
        tidalVolumeDelivered: vte,
        tidalVolumeExhaled: vte,
        measuredRR,
        minuteVolume: (vte * measuredRR) / 1000,
      })

      const { ti, te } = getBreathTiming(activeSettings)
      setMeasurements(computeMeasurements({
        tidalVolume: vte,
        peakPressure: peak,
        plateauPressure: plateau,
        peep: activeSettings.peep,
        peakFlow: peakFlowRef.current,
        respRate: measuredRR,
        compliance: patientRef.current.compliance,
        resistance: patientRef.current.resistance,
        ti,
        te,
      }))

      setLoop(breathSamplesRef.current)
      breathSamplesRef.current = []
      resetBreathTracking()
    }

    // Oxygenation follows the delivered FiO2 with a lag, so it is advanced
    // every tick rather than recomputed per breath.
    const mv = (deliveredVolumeRef.current * 60) / 1000
    spo2Ref.current = stepSpo2(
      spo2Ref.current,
      targetSpo2({
        fio2: fio2Ref.current,
        minuteVolume: mv > 0 ? mv : 6,
        compliance: patientRef.current.compliance,
      }),
      dt,
    )

    const buffer = bufferRef.current
    buffer.push(sample)
    if (buffer.length > BUFFER_LENGTH) buffer.shift()
  }, [resetBreathTracking, engageHold])

  // Render loop: copy refs into React state once per animation frame.
  useEffect(() => {
    if (!ventilating) return undefined
    const clock = new SimClock()
    let frameHandle

    const render = () => {
      setWaveform([...bufferRef.current])
      setSpo2(spo2Ref.current)
      frameHandle = requestAnimationFrame(render)
    }

    clock.start(tick)
    frameHandle = requestAnimationFrame(render)

    return () => {
      clock.stop()
      cancelAnimationFrame(frameHandle)
    }
  }, [ventilating, tick])

  // Alarm evaluation runs off the latest committed numerics.
  useEffect(() => {
    const timeSinceLastBreath = timeRef.current - lastBreathTimeRef.current
    setAlarms(evaluateAlarms({
      peakPressure: numerics.peakPressure,
      minuteVolume: numerics.minuteVolume,
      tidalVolumeExhaled: numerics.tidalVolumeExhaled,
      measuredRR: numerics.measuredRR,
      alarmLimits: settings.alarmLimits,
      timeSinceLastBreath,
      ventilating,
      technical: technicalRef.current,
    }))
  }, [numerics, settings.alarmLimits, ventilating])

  // Holds are armed and then captured at the correct point in the breath:
  // an inspiratory hold at end inspiration, an expiratory hold at end
  // expiration, which is where each reading is meaningful.
  const startManeuver = useCallback((type) => {
    if (maneuverRef.current) return
    pendingManeuverRef.current = type
    setManeuver({ label: labelFor(type), pending: true, readings: [] })
  }, [])

  const clearManeuver = useCallback(() => setManeuver(null), [])

  const reset = useCallback(() => {
    const peep = settingsRef.current.peep
    modeStateRef.current = (MODES[activeModeRef.current] ?? MODES[DEFAULT_MODE]).impl.initialState
    bufferRef.current = createEmptyBuffer(peep)
    breathSamplesRef.current = []
    timeRef.current = 0
    lastBreathTimeRef.current = 0
    breathIntervalsRef.current = []
    resetBreathTracking()
    setWaveform(createEmptyBuffer(peep))
    setLoop([])
    setNumerics(emptyNumerics(peep))
    setMeasurements(emptyMeasurements)
    setAlarms([])
    spo2Ref.current = null
    setSpo2(null)
    setManeuver(null)
    maneuverRef.current = null
    pendingManeuverRef.current = null
    maneuverElapsedRef.current = 0
  }, [resetBreathTracking])

  return {
    waveform, loop, numerics, measurements, alarms, spo2, reset,
    maneuver, startManeuver, clearManeuver,
  }
}
