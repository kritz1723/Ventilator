import { UNIT_SYSTEMS, setUnit, format } from '../config/units.js'

// A worked example per quantity, so the effect of a selection is visible at
// the moment it is made rather than only later on the monitor.
const SAMPLES = {
  pressure: 20,
  volume: 450,
  length: 180,
  weight: 70,
  flow: 60,
}

export default function UnitsTab({ units, onUnitsChange }) {
  return (
    <>
      <div className="doc-toolbar">
        <span className="doc-note-inline">
          Values are held internally in one canonical unit and converted only
          when displayed, so a value cannot be converted twice. Every displayed
          value carries the unit in force.
        </span>
      </div>

      <div className="doc-list">
        {Object.entries(UNIT_SYSTEMS).map(([quantity, sys]) => (
          <section key={quantity} className="unit-row">
            <div className="unit-info">
              <span className="licence-name">{sys.label}</span>
              <span className="licence-desc">
                Held as {sys.canonical}
              </span>
            </div>

            <div className="unit-options">
              {Object.values(sys.options).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={units[quantity] === opt.id ? 'facet active' : 'facet'}
                  onClick={() => onUnitsChange(setUnit(units, quantity, opt.id))}
                >{opt.label}</button>
              ))}
            </div>

            <span className="unit-sample tnum">
              {format(SAMPLES[quantity], units, quantity)}
            </span>
          </section>
        ))}
      </div>
    </>
  )
}
