import { useState } from 'react'
import { SEX_OPTIONS, deriveSettings, formatPbw, TIDAL_VOLUME_PER_KG } from '../engine/patientCalc.js'
import { TEST_SUITES } from '../engine/selfTests.js'
import TestPanel from './TestPanel.jsx'
import { SymbolCaution } from './Symbols.jsx'

export default function StandbyScreen({
  patientData,
  onPatientDataChange,
  onApplyDerivedSettings,
  onStartVentilation,
  testStatus,
  onTestComplete,
}) {
  const [openTest, setOpenTest] = useState(null)
  const derived = deriveSettings({
    sex: patientData.sex,
    heightCm: patientData.heightCm,
    mlPerKg: patientData.mlPerKg,
  })

  const canStart = derived != null

  return (
    <div className="standby">
      <div className="standby-head">
        <span className="standby-badge">Standby</span>
        <h2>Patient setup</h2>
        <p>Ventilation is stopped. Enter patient data, run the checks, then start ventilation.</p>
      </div>

      <div className="standby-grid">
        <section className="panel standby-section">
          <span className="panel-title">Patient data</span>

          <div className="field">
            <span className="field-label">Patient category</span>
            <div className="chip-row">
              {['Adult', 'Paediatric'].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={patientData.category === c ? 'chip active' : 'chip'}
                  onClick={() => onPatientDataChange({ ...patientData, category: c })}
                >{c}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Sex</span>
            <div className="chip-row">
              {SEX_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={patientData.sex === s.id ? 'chip active' : 'chip'}
                  onClick={() => onPatientDataChange({ ...patientData, sex: s.id })}
                >{s.label}</button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field-label">Height</span>
            <span className="inline-input">
              <input
                type="number"
                min="100"
                max="220"
                value={patientData.heightCm}
                onChange={(e) => onPatientDataChange({ ...patientData, heightCm: Number(e.target.value) })}
              />
              <span className="field-unit">cm</span>
            </span>
          </label>

          <label className="field">
            <span className="field-label">Vt target</span>
            <span className="inline-input">
              <input
                type="number"
                min={TIDAL_VOLUME_PER_KG.min}
                max={TIDAL_VOLUME_PER_KG.max}
                step="0.5"
                value={patientData.mlPerKg}
                onChange={(e) => onPatientDataChange({ ...patientData, mlPerKg: Number(e.target.value) })}
              />
              <span className="field-unit">mL/kg</span>
            </span>
          </label>

          <div className="derived-box">
            <div className="derived-row">
              <span>Predicted body weight</span>
              <b className="tnum">{formatPbw(derived?.predictedBodyWeight)}</b>
            </div>
            <div className="derived-row">
              <span>Suggested tidal volume</span>
              <b className="tnum">{derived ? `${derived.tidalVolume} mL` : '—'}</b>
            </div>
            <p className="derived-note">
              <SymbolCaution />
              Derived from height using a standard predicted-body-weight formula.
              Illustrative starting point only — review every setting before use.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={!derived}
            onClick={() => onApplyDerivedSettings(derived)}
          >
            Apply suggested settings
          </button>
        </section>

        <section className="panel standby-section">
          <span className="panel-title">Device checks</span>
          <div className="check-list">
            {[TEST_SUITES.partial, TEST_SUITES.leak].map((suite) => (
              <div key={suite.id} className="check-row">
                <div className="check-info">
                  <b>{suite.name}</b>
                  <span>{suite.description}</span>
                </div>
                <div className="check-actions">
                  <span className={testStatus[suite.id] ? 'check-state check-done' : 'check-state'}>
                    {testStatus[suite.id] ? 'Passed' : 'Not run'}
                  </span>
                  <button type="button" className="btn btn-ghost" onClick={() => setOpenTest(suite)}>
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>

          {openTest && (
            <TestPanel
              suite={openTest}
              onComplete={() => onTestComplete(openTest.id)}
              onClose={() => setOpenTest(null)}
            />
          )}
        </section>
      </div>

      <div className="standby-actions">
        <button
          type="button"
          className="btn btn-start-vent"
          disabled={!canStart}
          onClick={onStartVentilation}
        >
          Start ventilation
        </button>
        <p className="standby-hint">
          {canStart
            ? 'Settings can be adjusted at any time while ventilating.'
            : 'Enter a patient height to continue.'}
        </p>
      </div>
    </div>
  )
}
