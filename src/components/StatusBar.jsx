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
  onOxygenFlush, flushActive, flushRemaining,
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
            aria-label={flushActive
              ? `100 percent oxygen, ${flushRemaining} seconds remaining`
              : 'Deliver 100 percent oxygen for two minutes'}
          >
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
