import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import Disclaimer from './components/Disclaimer.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import WaveformDisplay from './components/WaveformDisplay.jsx'
import LoopsDisplay from './components/LoopsDisplay.jsx'
import NumericsPanel from './components/NumericsPanel.jsx'
import AlarmBanner from './components/AlarmBanner.jsx'
import StandbyScreen from './components/StandbyScreen.jsx'
import TestPanel from './components/TestPanel.jsx'
import DeviceInfoDrawer from './components/DeviceInfoDrawer.jsx'
import ManeuverResult from './components/ManeuverResult.jsx'
import AppFooter from './components/AppFooter.jsx'
import SnapshotPanel from './components/SnapshotPanel.jsx'
import EventLogDrawer from './components/EventLogDrawer.jsx'
import { useVentilatorEngine } from './state/useVentilatorEngine.js'
import { DEFAULT_SETTINGS, DEFAULT_PATIENT_DATA } from './state/defaultSettings.js'
import { PATIENT_PRESETS, DEFAULT_PATIENT_PRESET } from './engine/patientPresets.js'
import { PATIENT_CATEGORIES } from './engine/patientCategories.js'
import { TEST_SUITES } from './engine/selfTests.js'
import { AUDIO_PAUSE_SECONDS } from './engine/alarms.js'
import { THEMES, DEFAULT_THEME } from './config/themes.js'
import { DEFAULT_SELECTED_MEASUREMENTS } from './config/measurementCatalog.js'
import { MODES } from './engine/ventilatorModes/index.js'
import { DEFAULT_LAYOUT } from './config/traceCatalog.js'
import { createSnapshot, addSnapshot } from './engine/snapshots.js'
import {
  createEvent, appendEvent, diffSettings, diffAlarms, EVENT_CATEGORY,
} from './engine/eventLog.js'

const SCREEN = { POWER_ON: 'power-on', STANDBY: 'standby', VENTILATING: 'ventilating' }

export default function App() {
  const [screen, setScreen] = useState(SCREEN.POWER_ON)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [patientData, setPatientData] = useState(DEFAULT_PATIENT_DATA)
  const [patientKey, setPatientKey] = useState(DEFAULT_PATIENT_PRESET)
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [selectedMeasurements, setSelectedMeasurements] = useState(DEFAULT_SELECTED_MEASUREMENTS)
  const [testStatus, setTestStatus] = useState({})
  const [infoOpen, setInfoOpen] = useState(false)
  const [audioPausedUntil, setAudioPausedUntil] = useState(0)
  const [frozen, setFrozen] = useState(false)
  const [frozenWaveform, setFrozenWaveform] = useState(null)
  const [cursorIndex, setCursorIndex] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [events, setEvents] = useState([])
  const [logOpen, setLogOpen] = useState(false)
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [now, setNow] = useState(Date.now())

  const patient = PATIENT_PRESETS[patientKey]
  const ventilating = screen === SCREEN.VENTILATING

  const {
    waveform, loop, numerics, measurements, alarms, reset,
    maneuver, startManeuver, clearManeuver,
  } = useVentilatorEngine({
    settings,
    patient,
    ventilating,
    technical: { preUseCheckDue: !testStatus.partial },
  })

  const log = useCallback((entry) => {
    setEvents((prev) => appendEvent(prev, createEvent(entry)))
  }, [])

  const logMany = useCallback((entries) => {
    if (!entries.length) return
    setEvents((prev) => entries.reduce((acc, e) => appendEvent(acc, e), prev))
  }, [])

  // Settings and alarms are logged by comparing against the previous value,
  // so the log records the specific change rather than the whole state.
  const prevSettingsRef = useRef(settings)
  useEffect(() => {
    const entries = diffSettings(prevSettingsRef.current, settings)
    prevSettingsRef.current = settings
    logMany(entries)
  }, [settings, logMany])

  const prevAlarmsRef = useRef([])
  useEffect(() => {
    const entries = diffAlarms(prevAlarmsRef.current, alarms)
    prevAlarmsRef.current = alarms
    logMany(entries)
  }, [alarms, logMany])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Ticks the audio-pause countdown while it is active.
  useEffect(() => {
    if (audioPausedUntil <= Date.now()) return undefined
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [audioPausedUntil])

  const audioPaused = audioPausedUntil > now
  const pauseRemaining = Math.max(0, Math.ceil((audioPausedUntil - now) / 1000))

  // Freezing snapshots the current sweep; the engine keeps running
  // underneath so therapy and alarms are unaffected by inspecting a trace.
  const toggleFreeze = useCallback(() => {
    setFrozen((wasFrozen) => {
      if (wasFrozen) {
        setFrozenWaveform(null)
        setCursorIndex(null)
        return false
      }
      setFrozenWaveform(waveform)
      setCursorIndex(Math.floor(waveform.length / 2))
      return true
    })
  }, [waveform])

  const capture = useCallback(() => {
    const snap = createSnapshot({ numerics, measurements, settings, patient })
    setSnapshots((list) => addSnapshot(list, snap))
    log({
      category: EVENT_CATEGORY.CAPTURE,
      message: `Captured ${snap.id}`,
      detail: `Ppeak ${numerics.peakPressure.toFixed(0)}, Vte ${numerics.tidalVolumeExhaled.toFixed(0)}`,
    })
  }, [numerics, measurements, settings, patient, log])

  const startVentilation = useCallback(() => {
    reset()
    setFrozen(false)
    setFrozenWaveform(null)
    setCursorIndex(null)
    setScreen(SCREEN.VENTILATING)
    log({
      category: EVENT_CATEGORY.STATE,
      message: 'Ventilation started',
      detail: `${settings.mode}, ${patient.label}`,
    })
  }, [reset, log, settings.mode, patient.label])

  const applyDerived = useCallback((derived) => {
    setSettings((s) => ({
      ...s,
      tidalVolume: derived.tidalVolume,
      respRate: derived.respRate,
      peep: derived.peep,
      fio2: derived.fio2,
    }))
  }, [])

  if (screen === SCREEN.POWER_ON) {
    return (
      <div className="app app-centered">
        <Disclaimer />
        <div className="boot">
          <BrandMark large />
          <TestPanel
            suite={TEST_SUITES.powerOn}
            autoStart
            onComplete={() => {
              setTestStatus((s) => ({ ...s, powerOn: true }))
              log({ category: EVENT_CATEGORY.TEST, message: 'Power-on self test passed' })
            }}
          />
          <button
            type="button"
            className="btn btn-start-vent"
            disabled={!testStatus.powerOn}
            onClick={() => setScreen(SCREEN.STANDBY)}
          >
            {testStatus.powerOn ? 'Continue to standby' : 'Running self test…'}
          </button>
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="app">
      <Disclaimer />
      <header className="app-header">
        <div className="brand">
          <BrandMark />
          <div className="brand-text">
            <h1>ICU Ventilator Simulator</h1>
            <p>Concept interface · simulated data only</p>
          </div>
        </div>

        <div className="header-status">
          <span className={ventilating ? 'status-chip status-running' : 'status-chip status-standby'}>
            <span className="status-dot" />
            {ventilating ? 'Ventilating' : 'Standby'}
          </span>
          {ventilating && (
            <>
              <span className="status-chip">{MODES[settings.mode].label}</span>
              <span className="status-chip">{PATIENT_CATEGORIES[patientData.category]?.label ?? 'Adult'}</span>
              <span className="status-chip">{patient.label}</span>
            </>
          )}
          <div className="theme-picker" role="group" aria-label="Display theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.label}
                aria-label={t.label}
                className={t.id === theme ? 'theme-dot active' : 'theme-dot'}
                style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }}
                onClick={() => setTheme(t.id)}
              />
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-tiny" onClick={() => setLogOpen(true)}>
            Log{events.length ? ` (${events.length})` : ''}
          </button>
          <button type="button" className="btn btn-ghost btn-tiny" onClick={() => setInfoOpen(true)}>
            Device info
          </button>
        </div>
      </header>

      {screen === SCREEN.STANDBY ? (
        <StandbyScreen
          patientData={patientData}
          onPatientDataChange={setPatientData}
          onApplyDerivedSettings={applyDerived}
          onStartVentilation={startVentilation}
          testStatus={testStatus}
          onTestComplete={(id) => {
            setTestStatus((s) => ({ ...s, [id]: true }))
            log({ category: EVENT_CATEGORY.TEST, message: `${id === 'leak' ? 'Leak and compliance test' : 'Partial test'} passed` })
          }}
        />
      ) : (
        <main className="app-main">
          <ControlPanel
            settings={settings}
            onSettingsChange={setSettings}
            patientKey={patientKey}
            onPatientChange={setPatientKey}
            patientCategory={patientData.category}
            onManeuver={(type) => {
              startManeuver(type)
              log({
                category: EVENT_CATEGORY.MANEUVER,
                message: type === 'inspHold' ? 'Inspiratory hold requested' : 'Expiratory hold requested',
              })
            }}
            onStopVentilation={() => {
              setScreen(SCREEN.STANDBY)
              log({ category: EVENT_CATEGORY.STATE, message: 'Ventilation stopped — standby' })
            }}
          />
          <section className="monitor">
            <AlarmBanner
              alarms={alarms}
              audioPaused={audioPaused}
              pauseRemaining={pauseRemaining}
              onPauseAudio={() => {
                setAudioPausedUntil(Date.now() + AUDIO_PAUSE_SECONDS * 1000)
                log({
                  category: EVENT_CATEGORY.ALARM,
                  message: `Alarm audio paused for ${AUDIO_PAUSE_SECONDS}s`,
                })
              }}
            />
            <WaveformDisplay
              waveform={frozen && frozenWaveform ? frozenWaveform : waveform}
              layout={layout}
              onLayoutChange={setLayout}
              frozen={frozen}
              onToggleFreeze={toggleFreeze}
              cursorIndex={cursorIndex}
              onCursorChange={setCursorIndex}
            />
            <ManeuverResult maneuver={maneuver} onClose={clearManeuver} />
            <div className="monitor-lower">
              <NumericsPanel
                numerics={numerics}
                measurements={measurements}
                settings={settings}
                selected={selectedMeasurements}
                onSelectedChange={setSelectedMeasurements}
              />
              <LoopsDisplay loop={loop} />
            </div>
            <SnapshotPanel
              snapshots={snapshots}
              onCapture={capture}
              onClear={() => setSnapshots([])}
              numerics={numerics}
              measurements={measurements}
              settings={settings}
            />
          </section>
        </main>
      )}

      <AppFooter />
      <DeviceInfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />
      <EventLogDrawer open={logOpen} onClose={() => setLogOpen(false)} events={events} />
    </div>
  )
}

function BrandMark({ large = false }) {
  return (
    <div className={large ? 'brand-mark brand-mark-lg' : 'brand-mark'} aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <path d="M4 20h5l3-9 4 14 3-9h9" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
