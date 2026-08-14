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
import ConfirmDialog from './components/ConfirmDialog.jsx'
import AdminScreen from './components/AdminScreen.jsx'
import PendingChangesBar from './components/PendingChangesBar.jsx'
import { useVentilatorEngine } from './state/useVentilatorEngine.js'
import { DEFAULT_SETTINGS, DEFAULT_PATIENT_DATA } from './state/defaultSettings.js'
import { PATIENT_PRESETS, DEFAULT_PATIENT_PRESET } from './engine/patientPresets.js'
import { PATIENT_CATEGORIES } from './engine/patientCategories.js'
import { TEST_SUITES } from './engine/selfTests.js'
import { AUDIO_PAUSE_SECONDS } from './engine/alarms.js'
import { THEMES, DEFAULT_THEME } from './config/themes.js'
import { DEFAULT_SELECTED_MEASUREMENTS } from './config/measurementCatalog.js'
import { MODES, DEFAULT_MODE } from './engine/ventilatorModes/index.js'
import {
  DEFAULT_LICENCE, isEnabled, licensedModes, resolveActiveMode,
} from './config/licensing.js'
import { DEFAULT_UNITS } from './config/units.js'
import { DEFAULT_LANGUAGE, makeTranslator } from './config/i18n.js'
import { DEFAULT_LAYOUT } from './config/traceCatalog.js'
import {
  CONFIRMABLE, pendingDiff, clampToRanges,
} from './engine/pendingChanges.js'
import { createSnapshot, addSnapshot } from './engine/snapshots.js'
import {
  createEvent, appendEvent, diffSettings, diffAlarms, EVENT_CATEGORY,
} from './engine/eventLog.js'

const SCREEN = {
  POWER_ON: 'power-on',
  STANDBY: 'standby',
  VENTILATING: 'ventilating',
  ADMIN: 'admin',
}

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
  const [cursors, setCursors] = useState([null, null])
  const [snapshots, setSnapshots] = useState([])
  const [events, setEvents] = useState([])
  const [logOpen, setLogOpen] = useState(false)
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [licence, setLicence] = useState(DEFAULT_LICENCE)
  const [units, setUnits] = useState(DEFAULT_UNITS)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  // While ventilating, edits go to a pending copy and reach the patient only
  // when accepted. In standby they apply directly — nothing is being
  // delivered, so there is nothing to guard.
  const [pendingSettings, setPendingSettings] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [now, setNow] = useState(Date.now())

  const t = makeTranslator(language)
  const patient = PATIENT_PRESETS[patientKey]
  const ventilating = screen === SCREEN.VENTILATING
  // Configuration is reachable only from standby: changing the platform
  // while ventilating would alter behaviour underneath the operator.
  const canConfigure = screen === SCREEN.STANDBY
  const editedSettings = pendingSettings ?? settings
  // The licence filters the registry itself, so an unlicensed mode is
  // unreachable rather than merely hidden.
  const availableModes = licensedModes(licence, MODES)

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
    const resolved = resolveActiveMode(licence, MODES, settings.mode, DEFAULT_MODE)
    if (resolved !== settings.mode) {
      setSettings((s) => ({ ...s, mode: resolved }))
      log({
        category: EVENT_CATEGORY.MODE,
        message: `Mode changed to ${resolved} — previous mode is not licensed`,
      })
    }
  }, [licence, settings.mode, log])

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
        setCursors([null, null])
        return false
      }
      setFrozenWaveform(waveform)
      // Start with no cursor placed; the operator chooses both points.
      setCursors([null, null])
      return true
    })
  }, [waveform])

  // Mode is a therapy-level change, so it is confirmed rather than staged.
  const changeSettings = useCallback((next) => {
    if (!ventilating) {
      setSettings(next)
      return
    }
    if (next.mode !== settings.mode) {
      setConfirm({ action: CONFIRMABLE.MODE, payload: next.mode })
      return
    }
    setPendingSettings(next)
  }, [ventilating, settings.mode])

  const acceptPending = useCallback(() => {
    if (!pendingSettings) return
    setSettings(pendingSettings)
    setPendingSettings(null)
  }, [pendingSettings])

  const cancelPending = useCallback(() => {
    const discarded = pendingDiff(settings, pendingSettings)
    setPendingSettings(null)
    if (discarded.length) {
      log({
        category: EVENT_CATEGORY.SETTING,
        message: `${discarded.length} pending change${discarded.length === 1 ? '' : 's'} cancelled`,
        detail: discarded.map((c) => `${c.key} ${c.from}→${c.to}`).join(', '),
      })
    }
  }, [settings, pendingSettings, log])

  const capture = useCallback(() => {
    const snap = createSnapshot({ numerics, measurements, settings, patient })
    setSnapshots((list) => addSnapshot(list, snap))
    log({
      category: EVENT_CATEGORY.CAPTURE,
      message: `Captured ${snap.id}`,
      detail: `Ppeak ${numerics.peakPressure.toFixed(0)}, Vte ${numerics.tidalVolumeExhaled.toFixed(0)}`,
    })
  }, [numerics, measurements, settings, patient, log])

  const resolveConfirm = useCallback(() => {
    if (!confirm) return
    const { action, payload } = confirm
    setConfirm(null)

    if (action === CONFIRMABLE.MODE) {
      setSettings((s) => ({ ...s, mode: payload }))
      setPendingSettings(null)
    } else if (action === CONFIRMABLE.CATEGORY) {
      setPatientData((d) => ({ ...d, category: payload }))
      setSettings((s) => clampToRanges(s, PATIENT_CATEGORIES[payload].ranges))
      log({ category: EVENT_CATEGORY.SETTING, message: `Patient category changed to ${PATIENT_CATEGORIES[payload].label}` })
    } else if (action === CONFIRMABLE.STOP) {
      setPendingSettings(null)
      setScreen(SCREEN.STANDBY)
      log({ category: EVENT_CATEGORY.STATE, message: 'Ventilation stopped — standby' })
    } else if (action === CONFIRMABLE.START) {
      payload()
    }
  }, [confirm, log])

  const startVentilation = useCallback(() => {
    reset()
    setFrozen(false)
    setFrozenWaveform(null)
    setCursors([null, null])
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
        <Disclaimer t={t} />
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
        <AppFooter t={t} />
      </div>
    )
  }

  return (
    <div className="app">
      <Disclaimer t={t} />
      <header className="app-header">
        <div className="brand">
          <BrandMark />
          <div className="brand-text">
            <h1>ICU Ventilator Simulator</h1>
            <p>{t('app.subtitle')}</p>
          </div>
        </div>

        <div className="header-status">
          <span className={ventilating ? 'status-chip status-running' : 'status-chip status-standby'}>
            <span className="status-dot" />
            {ventilating ? t('state.ventilating') : t('state.standby')}
          </span>
          {ventilating && (
            <>
              <span className="status-chip">{MODES[settings.mode]?.label ?? settings.mode}</span>
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
          {screen !== SCREEN.ADMIN && (
            <button
              type="button"
              className="btn btn-ghost btn-tiny"
              disabled={!canConfigure}
              title={canConfigure
                ? 'Open configuration and development documents'
                : 'Available in standby only'}
              onClick={() => {
                setScreen(SCREEN.ADMIN)
                log({ category: EVENT_CATEGORY.STATE, message: 'Entered configuration' })
              }}
            >
              Config
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-tiny" onClick={() => setLogOpen(true)}>
            {t('action.log')}{events.length ? ` (${events.length})` : ''}
          </button>
          <button type="button" className="btn btn-ghost btn-tiny" onClick={() => setInfoOpen(true)}>
            {t('action.deviceInfo')}
          </button>
        </div>
      </header>

      {screen === SCREEN.ADMIN ? (
        <AdminScreen
          t={t}
          licence={licence}
          onLicenceChange={(next) => {
            setLicence(next)
            log({ category: EVENT_CATEGORY.SETTING, message: 'Feature configuration changed' })
          }}
          units={units}
          onUnitsChange={(next) => {
            setUnits(next)
            log({ category: EVENT_CATEGORY.SETTING, message: 'Display units changed' })
          }}
          language={language}
          onLanguageChange={(next) => {
            setLanguage(next)
            log({ category: EVENT_CATEGORY.SETTING, message: `Interface language changed to ${next}` })
          }}
          canEdit={!ventilating}
          blockedReason="Feature configuration is unavailable while ventilating. Stop ventilation to make changes."
          onExit={() => {
          setScreen(SCREEN.STANDBY)
          log({ category: EVENT_CATEGORY.STATE, message: 'Left configuration' })
        }} />
      ) : screen === SCREEN.STANDBY ? (
        <StandbyScreen
          patientData={patientData}
          onPatientDataChange={setPatientData}
          onApplyDerivedSettings={applyDerived}
          onStartVentilation={() => setConfirm({ action: CONFIRMABLE.START, payload: startVentilation })}
          testStatus={testStatus}
          onTestComplete={(id) => {
            setTestStatus((s) => ({ ...s, [id]: true }))
            log({ category: EVENT_CATEGORY.TEST, message: `${id === 'leak' ? 'Leak and compliance test' : 'Partial test'} passed` })
          }}
        />
      ) : (
        <main className="app-main">
          <ControlPanel
            settings={editedSettings}
            availableModes={availableModes}
            features={{
              maneuvers: isEnabled(licence, 'maneuvers'),
              flowPatterns: isEnabled(licence, 'flowPatterns'),
            }}
            onSettingsChange={changeSettings}
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
            t={t}
            onStopVentilation={() => setConfirm({ action: CONFIRMABLE.STOP })}
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
            <PendingChangesBar
              changes={pendingDiff(settings, pendingSettings)}
              onAccept={acceptPending}
              onCancel={cancelPending}
            />
            <WaveformDisplay
              waveform={frozen && frozenWaveform ? frozenWaveform : waveform}
              t={t}
              layout={layout}
              onLayoutChange={isEnabled(licence, 'waveformLayout') ? setLayout : null}
              frozen={frozen}
              onToggleFreeze={toggleFreeze}
              cursors={cursors}
              onCursorsChange={setCursors}
            />
            <ManeuverResult maneuver={maneuver} onClose={clearManeuver} />
            <div className="monitor-lower">
              <NumericsPanel
                numerics={numerics}
                measurements={measurements}
                settings={settings}
                selected={selectedMeasurements}
                onSelectedChange={setSelectedMeasurements}
                units={units}
              />
              {isEnabled(licence, 'loops') && <LoopsDisplay loop={loop} />}
            </div>
            {isEnabled(licence, 'captures') && (
              <SnapshotPanel
                snapshots={snapshots}
                onCapture={capture}
                onClear={() => setSnapshots([])}
                numerics={numerics}
                measurements={measurements}
                settings={settings}
              />
            )}
          </section>
        </main>
      )}

      <AppFooter t={t} />
      <DeviceInfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />
      <EventLogDrawer open={logOpen} onClose={() => setLogOpen(false)} events={events} />
      <ConfirmDialog
        action={confirm?.action ?? null}
        detail={confirm?.action === CONFIRMABLE.MODE
          ? `${MODES[settings.mode].label} → ${MODES[confirm.payload].label}`
          : null}
        onAccept={resolveConfirm}
        onCancel={() => setConfirm(null)}
      />
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
