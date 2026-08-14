import { useEffect, useState } from 'react'
import { MODES } from '../engine/ventilatorModes/index.js'
import { PATIENT_CATEGORIES } from '../engine/patientCategories.js'

// The status bar answers, without the operator asking: what mode, which
// patient, what time, is there power, and is anything alarming. Those are the
// facts needed to orient at a glance from across the bed space.
export default function StatusBar({
  settings, availableModes, patientCategory, ventilating,
  alarms, onModeChange, modeLocked, t,
  themes, theme, onThemeChange, onOpenLog, onOpenInfo, logCount, onStopVentilation,
  onOxygenFlush, flushActive, flushRemaining, onCapture, captureCount,
  audioEnabled, audioState, audioPaused, pauseRemaining, onPauseAudio, onAudioEnabledChange,
}) {
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 10_000)
    return () => clearInterval(timer)
  }, [])

  const modes = availableModes ?? MODES
  const mode = MODES[settings.mode]
  const highest = alarms.find((a) => a.priority === 'high')
    ?? alarms.find((a) => a.priority === 'medium')
    ?? alarms[0]

  return (
    <header className="status-bar">
      <div className="status-mode">
        <select
          value={settings.mode}
          disabled={modeLocked}
          aria-label="Ventilation mode"
          onChange={(e) => onModeChange(e.target.value)}
        >
          {Object.values(modes).map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <span className="status-mode-name">{mode?.name}</span>
      </div>

      <span className={ventilating ? 'status-pill running' : 'status-pill'}>
        <span className="status-dot" />
        {ventilating ? t('state.ventilating') : t('state.standby')}
      </span>

      <span className="status-pill">
        {PATIENT_CATEGORIES[patientCategory]?.label ?? 'Adult'}
      </span>

      <span className="status-clock tnum">
        {clock.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
        <b>{clock.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</b>
      </span>

      <div className="status-right">
        {/* Power and battery are cosmetic on a simulator, but their absence
            would make the shell read as incomplete to anyone who knows the
            equipment. They are marked as simulated in the device info. */}
        <span className="status-pill status-power" title="Simulated — mains power">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v8M8 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="5" y="11" width="14" height="10" rx="2" />
          </svg>
          AC
        </span>
        <span className="status-pill status-battery" title="Simulated — battery charge">
          <span className="battery-shell"><span className="battery-fill" style={{ width: '100%' }} /></span>
          100%
        </span>
        {themes && (
          <div className="theme-picker" role="group" aria-label="Display theme">
            {themes.map((th) => (
              <button
                key={th.id}
                type="button"
                title={th.label}
                aria-label={th.label}
                className={th.id === theme ? 'theme-dot active' : 'theme-dot'}
                style={{ background: `linear-gradient(135deg, ${th.swatch[0]} 50%, ${th.swatch[1]} 50%)` }}
                onClick={() => onThemeChange(th.id)}
              />
            ))}
          </div>
        )}
        {onOpenLog && (
          <button type="button" className="status-pill status-action" onClick={onOpenLog}>
            Log{logCount ? ` ${logCount}` : ''}
          </button>
        )}
        {onOpenInfo && (
          <button type="button" className="status-pill status-action" onClick={onOpenInfo}>
            Device
          </button>
        )}
        <span className={highest ? `status-pill alarm-count sev-${highest.priority}` : 'status-pill alarm-count'}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
          </svg>
          {alarms.length}
        </span>
        {/* Alarm audio. Two separate controls because they are two separate
            things: a pause that expires by itself, and an off that does not.
            Collapsing them into one would leave the operator unsure which
            they had pressed, which matters most in the case where they
            believe sound will come back and it will not. */}
        {onPauseAudio && (
          <button
            type="button"
            className={audioPaused ? 'status-pill status-action status-audio paused' : 'status-pill status-action status-audio'}
            onClick={onPauseAudio}
            disabled={!audioEnabled}
            title={audioEnabled
              ? 'Silence alarm audio briefly; it returns by itself'
              : 'Alarm audio is off, so there is nothing to pause'}
            aria-label={audioPaused
              ? `Alarm audio paused, ${pauseRemaining} seconds remaining`
              : 'Pause alarm audio'}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 9h4l5-4v14l-5-4H4z" strokeLinejoin="round" />
            </svg>
            {audioPaused ? `${pauseRemaining}s` : 'Pause'}
          </button>
        )}
        {onAudioEnabledChange && (
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(audioEnabled)}
            className={audioEnabled ? 'status-pill status-action status-mute' : 'status-pill status-mute is-off'}
            onClick={() => onAudioEnabledChange(!audioEnabled)}
            title={audioEnabled ? 'Turn alarm audio off' : 'Turn alarm audio on'}
            aria-label={audioEnabled ? 'Alarm audio on. Turn off' : 'Alarm audio off. Turn on'}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 9h4l5-4v14l-5-4H4z" strokeLinejoin="round" />
              {audioEnabled
                ? <path d="M16.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
                : <path d="M17 9.5l4 5M21 9.5l-4 5" strokeLinecap="round" />}
            </svg>
            {audioEnabled ? 'Audio' : 'Audio off'}
          </button>
        )}
        {/* A capture is taken at the moment something on the display is
            worth keeping, which is while the operator is looking at it. The
            page that reviews captures is not the page from which one is
            taken. */}
        {ventilating && onCapture && (
          <button
            type="button"
            className="status-pill status-action status-capture"
            onClick={onCapture}
            aria-label="Capture the present values"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
            Capture{captureCount ? ` ${captureCount}` : ''}
          </button>
        )}
        {/* Pre-oxygenation is done before suctioning and during a
            desaturation — both moments when the operator is watching the
            patient, not navigating. On a real device it is a dedicated key on
            the front panel; here it belongs on the bar that is always
            present, not on a page reached by choice. */}
        {ventilating && onOxygenFlush && (
          <button
            type="button"
            className={flushActive ? 'status-pill status-o2 active' : 'status-pill status-o2'}
            onClick={onOxygenFlush}
            aria-pressed={Boolean(flushActive)}
            title={flushActive
              ? 'End 100 % oxygen now and return to the set value'
              : 'Deliver 100 % oxygen for two minutes'}
            aria-label={flushActive
              ? `100 percent oxygen, ${flushRemaining} seconds remaining. Press to end now`
              : 'Deliver 100 percent oxygen for two minutes'}
          >
            {flushActive && (
              <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            )}
            O₂ {flushActive ? `${flushRemaining}s` : '100%'}
          </button>
        )}
        {/* Stopping ventilation is a decision that can be needed at once, so
            it stays on the top bar rather than inside a settings page. It is
            still confirmed before it takes effect. */}
        {ventilating && onStopVentilation && (
          <button type="button" className="status-stop" onClick={onStopVentilation}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            {t('action.stop')}
          </button>
        )}
      </div>
    </header>
  )
}
