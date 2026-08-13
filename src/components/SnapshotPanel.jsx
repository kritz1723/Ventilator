import { useState } from 'react'
import { MEASUREMENT_CATALOG } from '../config/measurementCatalog.js'
import { diffValue, formatClock } from '../engine/snapshots.js'

// Metrics offered in the comparison table. Numeric only — a comparison is
// only meaningful for values that can be subtracted.
const COMPARE_IDS = ['ppeak', 'pplat', 'peep', 'vte', 'mv', 'rr', 'cstat', 'cdyn', 'rinsp', 'driving']

function numericValue(id, ctx) {
  const entry = MEASUREMENT_CATALOG.find((m) => m.id === id)
  if (!entry) return null
  const raw = entry.read(ctx)
  const parsed = Number.parseFloat(raw)
  return Number.isNaN(parsed) ? null : parsed
}

export default function SnapshotPanel({
  snapshots, onCapture, onClear, numerics, measurements, settings,
}) {
  const [comparedId, setComparedId] = useState(null)
  const compared = snapshots.find((s) => s.id === comparedId) ?? null
  const liveCtx = { numerics, measurements, settings }

  return (
    <div className="snapshot-panel panel">
      <div className="panel-header snapshot-head">
        <span className="panel-title">Captures</span>
        <div className="snapshot-actions">
          <button type="button" className="btn btn-ghost btn-tiny" onClick={onCapture}>Capture</button>
          {snapshots.length > 0 && (
            <button type="button" className="btn btn-ghost btn-tiny" onClick={onClear}>Clear</button>
          )}
        </div>
      </div>

      {snapshots.length === 0 ? (
        <p className="snapshot-empty">
          No captures yet. Capture records the monitored values with the settings and
          lung mechanics in force at that moment, so a later comparison is between two
          fully described states.
        </p>
      ) : (
        <>
          <ul className="snapshot-list">
            {snapshots.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={s.id === comparedId ? 'snapshot-item active' : 'snapshot-item'}
                  onClick={() => setComparedId(s.id === comparedId ? null : s.id)}
                >
                  <span className="snapshot-id">{s.id}</span>
                  <span className="snapshot-time tnum">{formatClock(s.takenAt)}</span>
                  <span className="snapshot-meta">
                    {s.mode} · {s.patient.label} · PEEP {s.settings.peep}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {compared && (
            <div className="compare-table">
              <div className="compare-row compare-header">
                <span>Metric</span>
                <span>{compared.id}</span>
                <span>Now</span>
                <span>Δ</span>
              </div>
              {COMPARE_IDS.map((id) => {
                const entry = MEASUREMENT_CATALOG.find((m) => m.id === id)
                if (!entry) return null
                const ref = numericValue(id, {
                  numerics: compared.numerics,
                  measurements: compared.measurements,
                  settings: compared.settings,
                })
                const now = numericValue(id, liveCtx)
                const delta = diffValue(ref, now)
                return (
                  <div key={id} className="compare-row">
                    <span className="compare-metric">{entry.label}</span>
                    <span className="tnum">{ref == null ? '––' : ref}</span>
                    <span className="tnum">{now == null ? '––' : now}</span>
                    <span className={`tnum compare-delta${delta == null ? '' : delta > 0 ? ' up' : delta < 0 ? ' down' : ''}`}>
                      {delta == null ? '––' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
