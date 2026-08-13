import { useState } from 'react'
import { MEASUREMENT_CATALOG } from '../config/measurementCatalog.js'

export default function NumericsPanel({ numerics, measurements, settings, selected, onSelectedChange }) {
  const [picking, setPicking] = useState(false)
  const ctx = { numerics, measurements, settings }
  const shown = MEASUREMENT_CATALOG.filter((m) => selected.includes(m.id))

  const toggle = (id) => {
    onSelectedChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id],
    )
  }

  const groups = [...new Set(MEASUREMENT_CATALOG.map((m) => m.group))]

  return (
    <div className="numerics-panel panel">
      <div className="panel-header numerics-head">
        <span className="panel-title">Monitored values</span>
        <button type="button" className="btn btn-ghost btn-tiny" onClick={() => setPicking((p) => !p)}>
          {picking ? 'Done' : 'Configure'}
        </button>
      </div>

      {picking ? (
        <div className="measure-picker">
          {groups.map((g) => (
            <div key={g} className="measure-group">
              <span className="measure-group-title">{g}</span>
              <div className="measure-options">
                {MEASUREMENT_CATALOG.filter((m) => m.group === g).map((m) => (
                  <label key={m.id} className={selected.includes(m.id) ? 'measure-opt active' : 'measure-opt'}>
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggle(m.id)}
                    />
                    <span>{m.label}</span>
                    <em>{m.unit}</em>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="numerics-grid">
          {shown.map((m) => (
            <div key={m.id} className={`numeric numeric-${m.tone}`}>
              <span className="numeric-label">{m.label}</span>
              <span className="numeric-value tnum">{m.read(ctx)}</span>
              <span className="numeric-unit">{m.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
