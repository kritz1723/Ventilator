import { PATIENT_PRESETS } from '../engine/patientPresets.js'

function NumberField({ label, unit, value, onChange, min, max, step }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="field-input">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="field-unit">{unit}</span>
      </div>
    </label>
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
    <div className="control-panel">
      <div className="control-group">
        <span className="group-title">Mode</span>
        <div className="mode-toggle">
          {['VC', 'PC'].map((mode) => (
            <button
              key={mode}
              type="button"
              className={mode === settings.mode ? 'mode-button active' : 'mode-button'}
              onClick={() => update({ mode })}
            >
              {mode === 'VC' ? 'Volume Control' : 'Pressure Control'}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <span className="group-title">Ventilator settings</span>
        <NumberField label="Resp. rate" unit="/min" value={settings.respRate} min={4} max={60} step={1}
          onChange={(v) => update({ respRate: v })} />
        {settings.mode === 'VC' ? (
          <NumberField label="Tidal volume" unit="mL" value={settings.tidalVolume} min={100} max={1000} step={10}
            onChange={(v) => update({ tidalVolume: v })} />
        ) : (
          <NumberField label="Insp. pressure" unit="cmH2O" value={settings.pInsp} min={5} max={40} step={1}
            onChange={(v) => update({ pInsp: v })} />
        )}
        <NumberField label="PEEP" unit="cmH2O" value={settings.peep} min={0} max={20} step={1}
          onChange={(v) => update({ peep: v })} />
        <NumberField label="FiO2" unit="%" value={settings.fio2} min={21} max={100} step={1}
          onChange={(v) => update({ fio2: v })} />
        {settings.mode === 'VC' && (
          <NumberField label="Insp. pause" unit="s" value={settings.pauseTime} min={0} max={1} step={0.1}
            onChange={(v) => update({ pauseTime: v })} />
        )}
      </div>

      <div className="control-group">
        <span className="group-title">Alarm limits</span>
        <NumberField label="High pressure" unit="cmH2O" value={settings.alarmLimits.highPressure} min={10} max={80} step={1}
          onChange={(v) => update({ alarmLimits: { ...settings.alarmLimits, highPressure: v } })} />
        <NumberField label="Low pressure" unit="cmH2O" value={settings.alarmLimits.lowPressure} min={0} max={20} step={1}
          onChange={(v) => update({ alarmLimits: { ...settings.alarmLimits, lowPressure: v } })} />
      </div>

      <div className="control-group">
        <span className="group-title">Simulated patient (illustrative)</span>
        <select value={patientKey} onChange={(e) => onPatientChange(e.target.value)}>
          {Object.entries(PATIENT_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>{preset.label}</option>
          ))}
        </select>
      </div>

      <div className="control-group run-controls">
        {running ? (
          <button type="button" className="btn btn-stop" onClick={onStop}>Pause</button>
        ) : (
          <button type="button" className="btn btn-start" onClick={onStart}>Run</button>
        )}
        <button type="button" className="btn btn-reset" onClick={onReset}>Reset</button>
      </div>
    </div>
  )
}
