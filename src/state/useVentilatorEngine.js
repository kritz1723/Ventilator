import { useCallback, useEffect, useRef, useState } from 'react'
import { SimClock } from '../engine/clock.js'
import { MODES, DEFAULT_MODE } from '../engine/ventilatorModes/index.js'
import { getBreathTiming } from '../engine/ventilatorModes/breathTiming.js'
import { evaluateAlarms } from '../engine/alarms.js'
import { computeMeasurements } from '../engine/measurements.js'

const WAVEFORM_SECONDS = 10
const SAMPLE_HZ = 50
export const BUFFER_LENGTH = WAVEFORM_SECONDS * SAMPLE_HZ

const INSPIRATION_PHASES = new Set(['inspiration-flow', 'inspiration-pause', 'inspiration'])

function createEmptyBuffer(peep = 0) {
  return Array.from({ length: BUFFER_LENGTH }, () => ({ pressure: peep, flow: 0, volume: 0 }))
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
export function useVentilatorEngine({ settings, patient, ventilating, technical }) {
  const [waveform, setWaveform] = useState(() => createEmptyBuffer(settings.peep))
  const [loop, setLoop] = useState([])
  const [numerics, setNumerics] = useState(() => emptyNumerics(settings.peep))
  const [measurements, setMeasurements] = useState(emptyMeasurements)
  const [alarms, setAlarms] = useState([])

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

  const tick = useCallback((dt) => {
    const activeSettings = settingsRef.current
    const impl = (MODES[activeModeRef.current] ?? MODES[DEFAULT_MODE]).impl
    const result = impl.step({
      state: modeStateRef.current,
      settings: activeSettings,
      patient: patientRef.current,
      dt,
    })
    modeStateRef.current = result
    timeRef.current += dt

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

    const sample = { pressure: result.pressure, flow: result.flow, volume: result.volume }
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

    const buffer = bufferRef.current
    buffer.push(sample)
    if (buffer.length > BUFFER_LENGTH) buffer.shift()
  }, [resetBreathTracking])

  // Render loop: copy refs into React state once per animation frame.
  useEffect(() => {
    if (!ventilating) return undefined
    const clock = new SimClock()
    let frameHandle

    const render = () => {
      setWaveform([...bufferRef.current])
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
  }, [resetBreathTracking])

  return { waveform, loop, numerics, measurements, alarms, reset }
}
