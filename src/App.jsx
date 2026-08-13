import { useCallback, useEffect, useState } from 'react'
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
import { useVentilatorEngine } from './state/useVentilatorEngine.js'
import { DEFAULT_SETTINGS, DEFAULT_PATIENT_DATA } from './state/defaultSettings.js'
import { PATIENT_PRESETS, DEFAULT_PATIENT_PRESET } from './engine/patientPresets.js'
import { PATIENT_CATEGORIES } from './engine/patientCategories.js'
import { TEST_SUITES } from './engine/selfTests.js'
import { AUDIO_PAUSE_SECONDS } from './engine/alarms.js'
import { THEMES, DEFAULT_THEME } from './config/themes.js'
import { DEFAULT_SELECTED_MEASUREMENTS } from './config/measurementCatalog.js'
import { MODES } from './engine/ventilatorModes/index.js'

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
  const [now, setNow] = useState(Date.now())

  const patient = PATIENT_PRESETS[patientKey]
  const ventilating = screen === SCREEN.VENTILATING

  const { waveform, loop, numerics, measurements, alarms, reset } = useVentilatorEngine({
    settings,
    patient,
    ventilating,
    technical: { preUseCheckDue: !testStatus.partial },
  })

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

  const startVentilation = useCallback(() => {
    reset()
    setScreen(SCREEN.VENTILATING)
  }, [reset])

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
            onComplete={() => setTestStatus((s) => ({ ...s, powerOn: true }))}
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
          onTestComplete={(id) => setTestStatus((s) => ({ ...s, [id]: true }))}
        />
      ) : (
        <main className="app-main">
          <ControlPanel
            settings={settings}
            onSettingsChange={setSettings}
            patientKey={patientKey}
            onPatientChange={setPatientKey}
            patientCategory={patientData.category}
            onManeuver={() => {}}
            onStopVentilation={() => setScreen(SCREEN.STANDBY)}
          />
          <section className="monitor">
            <AlarmBanner
              alarms={alarms}
              audioPaused={audioPaused}
              pauseRemaining={pauseRemaining}
              onPauseAudio={() => setAudioPausedUntil(Date.now() + AUDIO_PAUSE_SECONDS * 1000)}
            />
            <WaveformDisplay waveform={waveform} />
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
          </section>
        </main>
      )}

      <DeviceInfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />
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
