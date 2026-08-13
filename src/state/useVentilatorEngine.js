import { useCallback, useEffect, useRef, useState } from 'react'
import { SimClock } from '../engine/clock.js'
import * as volumeControl from '../engine/ventilatorModes/volumeControl.js'
import * as pressureControl from '../engine/ventilatorModes/pressureControl.js'
import { evaluateAlarms } from '../engine/alarms.js'

const WAVEFORM_SECONDS = 10
const SAMPLE_HZ = 50
export const BUFFER_LENGTH = WAVEFORM_SECONDS * SAMPLE_HZ

const MODES = { VC: volumeControl, PC: pressureControl }

const INSPIRATION_PHASES = new Set(['inspiration-flow', 'inspiration-pause', 'inspiration'])

function createEmptyBuffer() {
  return Array.from({ length: BUFFER_LENGTH }, () => ({ pressure: 0, flow: 0, volume: 0 }))
}

function emptyNumerics(peep) {
  return {
    peakPressure: peep,
    plateauPressure: peep,
    peep,
    tidalVolumeDelivered: 0,
    tidalVolumeExhaled: 0,
    measuredRR: 0,
    minuteVolume: 0,
  }
}

// Drives the simulation clock, steps the active ventilator mode against the
// lung model each tick, and derives the waveform buffer + clinical numerics
// the UI reads. Runs the fixed-step physics inside refs (not React state)
// so the integration is not affected by render timing.
export function useVentilatorEngine({ settings, patient }) {
  const [running, setRunning] = useState(true)
  const [waveform, setWaveform] = useState(() => createEmptyBuffer())
  const [numerics, setNumerics] = useState(() => emptyNumerics(settings.peep))
  const [alarms, setAlarms] = useState([])

  const settingsRef = useRef(settings)
  const patientRef = useRef(patient)
  settingsRef.current = settings
  patientRef.current = patient

  const clockRef = useRef(null)
  const modeStateRef = useRef(MODES[settings.mode].initialState)
  const bufferRef = useRef(createEmptyBuffer())
  const timeRef = useRef(0)
  const breathPeakRef = useRef(settings.peep)
  const plateauRef = useRef(settings.peep)
  const deliveredVolumeRef = useRef(0)
  const lastBreathTimeRef = useRef(0)
  const breathIntervalsRef = useRef([])
  const lastExhaledVolumeRef = useRef(0)
  const activeModeNameRef = useRef(settings.mode)

  const resetBreathTracking = useCallback(() => {
    breathPeakRef.current = settingsRef.current.peep
    plateauRef.current = settingsRef.current.peep
    deliveredVolumeRef.current = 0
  }, [])

  // Reset engine state when the mode or patient preset changes.
  useEffect(() => {
    if (activeModeNameRef.current !== settings.mode) {
      activeModeNameRef.current = settings.mode
      modeStateRef.current = MODES[settings.mode].initialState
      resetBreathTracking()
      lastBreathTimeRef.current = timeRef.current
    }
  }, [settings.mode, resetBreathTracking])

  const tick = useCallback((dt) => {
    const modeImpl = MODES[activeModeNameRef.current]
    const result = modeImpl.step({
      state: modeStateRef.current,
      settings: settingsRef.current,
      patient: patientRef.current,
      dt,
    })
    modeStateRef.current = result
    timeRef.current += dt

    if (INSPIRATION_PHASES.has(result.phase)) {
      breathPeakRef.current = Math.max(breathPeakRef.current, result.pressure)
      deliveredVolumeRef.current = Math.max(deliveredVolumeRef.current, result.volume)
      if (result.phase === 'inspiration-pause' || result.flow === 0) {
        plateauRef.current = result.pressure
      }
    }

    if (result.breathComplete) {
      const interval = timeRef.current - lastBreathTimeRef.current
      lastBreathTimeRef.current = timeRef.current
      breathIntervalsRef.current = [...breathIntervalsRef.current, interval].slice(-6)
      lastExhaledVolumeRef.current = deliveredVolumeRef.current

      const avgInterval = breathIntervalsRef.current.reduce((a, b) => a + b, 0) / breathIntervalsRef.current.length
      const measuredRR = avgInterval > 0 ? 60 / avgInterval : 0

      setNumerics({
        peakPressure: breathPeakRef.current,
        plateauPressure: plateauRef.current,
        peep: settingsRef.current.peep,
        tidalVolumeDelivered: deliveredVolumeRef.current,
        tidalVolumeExhaled: lastExhaledVolumeRef.current,
        measuredRR,
        minuteVolume: (lastExhaledVolumeRef.current * measuredRR) / 1000,
      })

      resetBreathTracking()
    }

    const buffer = bufferRef.current
    buffer.push({ pressure: result.pressure, flow: result.flow, volume: result.volume })
    if (buffer.length > BUFFER_LENGTH) buffer.shift()
  }, [resetBreathTracking])

  // Render loop: copy refs into React state once per animation frame.
  useEffect(() => {
    if (!running) return undefined
    const clock = new SimClock()
    clockRef.current = clock
    let frameHandle

    const render = () => {
      setWaveform([...bufferRef.current])
      const timeSinceLastBreath = timeRef.current - lastBreathTimeRef.current
      setAlarms(
        evaluateAlarms({
          peakPressure: breathPeakRef.current,
          alarmLimits: settingsRef.current.alarmLimits,
          timeSinceLastBreath,
        }),
      )
      frameHandle = requestAnimationFrame(render)
    }

    clock.start(tick)
    frameHandle = requestAnimationFrame(render)

    return () => {
      clock.stop()
      cancelAnimationFrame(frameHandle)
    }
  }, [running, tick])

  const reset = useCallback(() => {
    modeStateRef.current = MODES[activeModeNameRef.current].initialState
    bufferRef.current = createEmptyBuffer()
    timeRef.current = 0
    lastBreathTimeRef.current = 0
    breathIntervalsRef.current = []
    resetBreathTracking()
    setWaveform(createEmptyBuffer())
    setNumerics(emptyNumerics(settingsRef.current.peep))
    setAlarms([])
  }, [resetBreathTracking])

  return {
    running,
    start: () => setRunning(true),
    stop: () => setRunning(false),
    reset,
    waveform,
    numerics,
    alarms,
  }
}
