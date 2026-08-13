import { PATIENT_PRESETS } from '../engine/patientPresets.js'

function NumberField({ label, unit, value, onChange, min, max, step }) {
  const clamp = (v) => Math.min(Math.max(v, min), max)
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="stepper">
        <button type="button" className="stepper-btn" aria-label={`Decrease ${label}`}
          onClick={() => onChange(Number(clamp(value - step).toFixed(2)))}>−</button>
        <span className="stepper-readout">
          <span className="stepper-value tnum">{value}</span>
          <span className="stepper-unit">{unit}</span>
        </span>
        <button type="button" className="stepper-btn" aria-label={`Increase ${label}`}
          onClick={() => onChange(Number(clamp(value + step).toFixed(2)))}>+</button>
      </div>
    </div>
  )
}

export default function ControlPanel({
  settings,
  onSettingsChange,
  patientKey,
  onPatientChange,
  running,
  onStart,
  onStop,
  onReset,
}) {
  const update = (patch) => onSettingsChange({ ...settings, ...patch })

  return (
    <aside className="control-panel">
      <section className="panel control-section">
        <span className="panel-title">Mode</span>
        <div className="segmented">
          {[
            { id: 'VC', label: 'Volume', sub: 'control' },
            { id: 'PC', label: 'Pressure', sub: 'control' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              className={m.id === settings.mode ? 'segment active' : 'segment'}
              onClick={() => update({ mode: m.id })}
            >
              <span className="segment-label">{m.label}</span>
              <span className="segment-sub">{m.sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel control-section">
        <span className="panel-title">Settings</span>
        <NumberField label="Rate" unit="/min" value={settings.respRate} min={4} max={60} step={1}
          onChange={(v) => update({ respRate: v })} />
        {settings.mode === 'VC' ? (
          <NumberField label="Tidal vol." unit="mL" value={settings.tidalVolume} min={100} max={1000} step={10}
            onChange={(v) => update({ tidalVolume: v })} />
        ) : (
          <NumberField label="P insp." unit="cmH₂O" value={settings.pInsp} min={5} max={40} step={1}
            onChange={(v) => update({ pInsp: v })} />
        )}
        <NumberField label="PEEP" unit="cmH₂O" value={settings.peep} min={0} max={20} step={1}
          onChange={(v) => update({ peep: v })} />
        <NumberField label="FiO₂" unit="%" value={settings.fio2} min={21} max={100} step={5}
          onChange={(v) => update({ fio2: v })} />
        {settings.mode === 'VC' && (
          <NumberField label="Insp. pause" unit="s" value={settings.pauseTime} min={0} max={1} step={0.1}
            onChange={(v) => update({ pauseTime: v })} />
        )}
      </section>

      <section className="panel control-section">
        <span className="panel-title">Alarm limits</span>
        <NumberField label="P high" unit="cmH₂O" value={settings.alarmLimits.highPressure} min={10} max={80} step={1}
          onChange={(v) => update({ alarmLimits: { ...settings.alarmLimits, highPressure: v } })} />
        <NumberField label="P low" unit="cmH₂O" value={settings.alarmLimits.lowPressure} min={0} max={20} step={1}
          onChange={(v) => update({ alarmLimits: { ...settings.alarmLimits, lowPressure: v } })} />
      </section>

      <section className="panel control-section">
        <span className="panel-title">Simulated patient</span>
        <div className="select-wrap">
          <select value={patientKey} onChange={(e) => onPatientChange(e.target.value)}>
            {Object.entries(PATIENT_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.label}</option>
            ))}
          </select>
        </div>
        <div className="preset-stats">
          <span>C <b className="tnum">{PATIENT_PRESETS[patientKey].compliance}</b> mL/cmH₂O</span>
          <span>R <b className="tnum">{PATIENT_PRESETS[patientKey].resistance}</b> cmH₂O/L/s</span>
        </div>
        <p className="preset-note">Illustrative values — not clinical reference data.</p>
      </section>

      <div className="run-controls">
        {running ? (
          <button type="button" className="btn btn-pause" onClick={onStop}>Pause</button>
        ) : (
          <button type="button" className="btn btn-run" onClick={onStart}>Run</button>
        )}
        <button type="button" className="btn btn-reset" onClick={onReset}>Reset</button>
      </div>
    </aside>
  )
}
