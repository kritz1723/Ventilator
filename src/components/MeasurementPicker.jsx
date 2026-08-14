import { MEASUREMENT_CATALOG } from '../config/measurementCatalog.js'

// Choosing which values occupy the display belongs next to the display, not
// on another page. Different phases of care depend on different numbers, and
// a fixed set forces the relevant one off screen.
export default function MeasurementPicker({ open, selected, onSelectedChange, onClose }) {
  if (!open) return null

  const groups = MEASUREMENT_CATALOG.reduce((acc, m) => {
    (acc[m.group] ??= []).push(m)
    return acc
  }, {})

  const toggle = (id) => {
    // At least one value must remain, or the rail would be empty with no way
    // back to it.
    if (selected.includes(id) && selected.length === 1) return
    onSelectedChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id],
    )
  }

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Monitored values"
      >
        <header className="drawer-head">
          <div>
            <h2>Monitored values</h2>
            <p>{selected.length} shown on the numeric rail</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </header>

        <div className="drawer-body">
          {Object.entries(groups).map(([group, entries]) => (
            <section key={group} className="picker-group">
              <span className="picker-group-title">{group}</span>
              <div className="picker-options">
                {entries.map((m) => {
                  const on = selected.includes(m.id)
                  const only = on && selected.length === 1
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      disabled={only}
                      title={only ? 'At least one value must stay on the display' : undefined}
                      className={on ? `picker-option on tone-${m.tone}` : 'picker-option'}
                      onClick={() => toggle(m.id)}
                    >
                      <span className="picker-label">{m.label}</span>
                      <span className="picker-unit">{m.unit || '—'}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </aside>
    </div>
  )
}
