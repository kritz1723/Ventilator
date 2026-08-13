import { useState } from 'react'
import './App.css'
import Disclaimer from './components/Disclaimer.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import WaveformDisplay from './components/WaveformDisplay.jsx'
import NumericsPanel from './components/NumericsPanel.jsx'
import AlarmPanel from './components/AlarmPanel.jsx'
import { useVentilatorEngine } from './state/useVentilatorEngine.js'
import { DEFAULT_SETTINGS } from './state/defaultSettings.js'
import { PATIENT_PRESETS, DEFAULT_PATIENT_PRESET } from './engine/patientPresets.js'

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [patientKey, setPatientKey] = useState(DEFAULT_PATIENT_PRESET)
  const patient = PATIENT_PRESETS[patientKey]

  const { running, start, stop, reset, waveform, numerics, alarms } = useVentilatorEngine({ settings, patient })

  return (
    <div className="app">
      <Disclaimer />
      <header className="app-header">
        <h1>ICU Ventilator Simulator</h1>
        <span className="app-subtitle">Educational / training simulation — single-compartment lung model</span>
      </header>
      <main className="app-main">
        <ControlPanel
          settings={settings}
          onSettingsChange={setSettings}
          patientKey={patientKey}
          onPatientChange={setPatientKey}
          running={running}
          onStart={start}
          onStop={stop}
          onReset={reset}
        />
        <section className="monitor">
          <AlarmPanel alarms={alarms} />
          <WaveformDisplay waveform={waveform} />
          <NumericsPanel numerics={numerics} settings={settings} />
        </section>
      </main>
    </div>
  )
}
