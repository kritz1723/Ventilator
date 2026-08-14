import { MEASUREMENT_CATALOG } from '../config/measurementCatalog.js'
import { format, unitLabel, toDisplay } from '../config/units.js'

// Each tile carries a scale showing where the value sits between its display
// bounds. A number alone says what it is; the scale says whether that is high
// or low for the range in use, which is the judgement being made at a glance.
const BOUNDS = {
  ppeak: [0, 40],
  pmean: [0, 20],
  peep: [0, 20],
  vte: [0, 800],
  rr: [0, 40],
  fio2: [21, 100],
  spo2: [70, 100],
  mv: [0, 20],
  cstat: [0, 100],
  driving: [0, 30],
  peakflow: [0, 150],
}

function Tile({ entry, ctx, units }) {
  const bounds = BOUNDS[entry.id] ?? null

  const value = entry.quantity && entry.raw && units
    ? format(entry.raw(ctx), units, entry.quantity, { withUnit: false })
    : entry.read(ctx)
  const unit = entry.quantity && units ? unitLabel(units, entry.quantity) : entry.unit

  // The scale is drawn in display units so the marker lines up with the
  // number beside it rather than with the canonical value behind it.
  let fraction = null
  let lo = null
  let hi = null
  if (bounds) {
    const raw = entry.raw ? entry.raw(ctx) : Number.parseFloat(entry.read(ctx))
    const shown = entry.quantity && units ? toDisplay(raw, units, entry.quantity) : raw
    const loB = entry.quantity && units ? toDisplay(bounds[0], units, entry.quantity) : bounds[0]
    const hiB = entry.quantity && units ? toDisplay(bounds[1], units, entry.quantity) : bounds[1]
    lo = loB
    hi = hiB
    if (shown != null && !Number.isNaN(shown) && hiB > loB) {
      fraction = Math.min(Math.max((shown - loB) / (hiB - loB), 0), 1)
    }
  }

  return (
    <div className={`rail-tile tone-${entry.tone}`}>
      <div className="rail-tile-head">
        <span className="rail-label">{entry.label}</span>
        <span className="rail-unit">{unit}</span>
      </div>
      <div className="rail-tile-body">
        <span className="rail-value tnum">{value}</span>
        {bounds && (
          <div className="rail-scale" aria-hidden="true">
            <span className="rail-bound tnum">{Math.round(hi)}</span>
            <div className="rail-track">
              {fraction != null && (
                <span className="rail-marker" style={{ bottom: `${(fraction * 100).toFixed(1)}%` }} />
              )}
            </div>
            <span className="rail-bound tnum">{Math.round(lo)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NumericRail({ numerics, measurements, settings, selected, units }) {
  const ctx = { numerics, measurements, settings }
  const shown = MEASUREMENT_CATALOG.filter((m) => selected.includes(m.id))

  return (
    <div className="numeric-rail">
      {shown.map((entry) => (
        <Tile key={entry.id} entry={entry} ctx={ctx} units={units} />
      ))}
    </div>
  )
}
