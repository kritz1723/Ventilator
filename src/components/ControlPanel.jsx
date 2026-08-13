import { PATIENT_PRESETS } from '../engine/patientPresets.js'
import { MODES } from '../engine/ventilatorModes/index.js'
import { FLOW_PATTERNS } from '../engine/flowPatterns.js'
import { rangeFor } from '../engine/patientCategories.js'

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
  patientCategory,
  onManeuver,
  onStopVentilation,
}) {
  const update = (patch) => onSettingsChange({ ...settings, ...patch })
  const mode = MODES[settings.mode]
  const vtRange = rangeFor(patientCategory, 'tidalVolume')
  const rrRange = rangeFor(patientCategory, 'respRate')
  const piRange = rangeFor(patientCategory, 'pInsp')
  const peepRange = rangeFor(patientCategory, 'peep')

  return (
    <aside className="control-panel">
      <section className="panel control-section">
        <span className="panel-title">Mode</span>
        <div className="mode-list">
          {Object.values(MODES).map((m) => (
            <button
              key={m.id}
              type="button"
              className={m.id === settings.mode ? 'mode-item active' : 'mode-item'}
              onClick={() => update({ mode: m.id })}
            >
              <span className="mode-code">{m.label}</span>
              <span className="mode-name">{m.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel control-section">
        <span className="panel-title">Settings</span>
        <NumberField label="Rate" unit="/min" value={settings.respRate}
          min={rrRange.min} max={rrRange.max} step={rrRange.step}
          onChange={(v) => update({ respRate: v })} />

        {mode.primaryControl === 'tidalVolume' ? (
          <NumberField label="Tidal vol." unit="mL" value={settings.tidalVolume}
            min={vtRange.min} max={vtRange.max} step={vtRange.step}
            onChange={(v) => update({ tidalVolume: v })} />
        ) : (
          <NumberField label="P insp." unit="cmH₂O" value={settings.pInsp}
            min={piRange.min} max={piRange.max} step={piRange.step}
            onChange={(v) => update({ pInsp: v })} />
        )}

        <NumberField label="PEEP" unit="cmH₂O" value={settings.peep}
          min={peepRange.min} max={peepRange.max} step={peepRange.step}
          onChange={(v) => update({ peep: v })} />
        <NumberField label="FiO₂" unit="%" value={settings.fio2} min={21} max={100} step={5}
          onChange={(v) => update({ fio2: v })} />
        <NumberField label="Insp. pause" unit="s" value={settings.pauseTime} min={0} max={1} step={0.1}
          onChange={(v) => update({ pauseTime: v })} />
        <NumberField label="Trigger" unit="L/min" value={settings.triggerFlow} min={0.5} max={15} step={0.5}
          onChange={(v) => update({ triggerFlow: v })} />
      </section>

      {mode.supportsFlowPattern && (
        <section className="panel control-section">
          <span className="panel-title">Flow pattern</span>
          <div className="pattern-row">
            {Object.values(FLOW_PATTERNS).map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.description}
                className={p.id === settings.flowPattern ? 'pattern-btn active' : 'pattern-btn'}
                onClick={() => update({ flowPattern: p.id })}
              >
                <PatternGlyph id={p.id} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel control-section">
        <span className="panel-title">Maneuvers</span>
        <div className="maneuver-row">
          <button type="button" className="btn btn-ghost" onClick={() => onManeuver('inspHold')}>Insp. hold</button>
          <button type="button" className="btn btn-ghost" onClick={() => onManeuver('expHold')}>Exp. hold</button>
        </div>
      </section>

      <section className="panel control-section">
        <span className="panel-title">Simulated lung</span>
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
        <button type="button" className="btn btn-stop-vent" onClick={onStopVentilation}>
          Stop ventilation
        </button>
      </div>
    </aside>
  )
}

function PatternGlyph({ id }) {
  const paths = {
    square: 'M2 14h3V4h10v10h3',
    decelerating: 'M2 14h3L15 4v10h3',
    accelerating: 'M2 14h3v10M5 14 15 4v10h3',
    sine: 'M2 14h3c2.5 0 2.5-10 5-10s2.5 10 5 10h3',
  }
  return (
    <svg viewBox="0 0 20 18" className="pattern-glyph" aria-hidden="true">
      <path d={id === 'accelerating' ? 'M2 14h3l10-10v10h3' : paths[id]}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
