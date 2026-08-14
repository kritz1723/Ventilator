import { useState } from 'react'
import { format, unitLabel } from '../config/units.js'
import { MEASUREMENT_CATALOG } from '../config/measurementCatalog.js'

export default function NumericsPanel({
  numerics, measurements, settings, selected, onSelectedChange, units,
}) {
  const [picking, setPicking] = useState(false)
  const ctx = { numerics, measurements, settings }

  // Entries tagged with a quantity are held canonically and converted here,
  // at display. The precision comes from the unit's own definition rather
  // than being guessed per call site, so cmH2O reads whole and hPa reads to
  // a decimal without the caller knowing which is in force.
  const valueOf = (m) => {
    if (!units || !m.quantity || !m.raw) return m.read(ctx)
    return format(m.raw(ctx), units, m.quantity, { withUnit: false })
  }

  const unitOf = (m) => (units && m.quantity ? unitLabel(units, m.quantity) : m.unit)
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
              <span className="numeric-value tnum">{valueOf(m)}</span>
              <span className="numeric-unit">{unitOf(m)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
