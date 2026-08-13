export default function ManeuverResult({ maneuver, onClose }) {
  if (!maneuver) return null

  return (
    <div className="maneuver-result panel">
      <div className="maneuver-head">
        <span className="panel-title">{maneuver.label}</span>
        <button type="button" className="btn btn-ghost btn-tiny" onClick={onClose}>Dismiss</button>
      </div>
      {maneuver.pending && (
        <p className="maneuver-pending">Armed — waiting for the end of the current phase…</p>
      )}
      <div className="maneuver-readings">
        {maneuver.readings.map((r) => (
          <div key={r.label} className="maneuver-reading">
            <span className="maneuver-reading-label">{r.label}</span>
            <span className="maneuver-reading-value tnum">
              {r.value == null ? '––' : r.value.toFixed(r.digits)}
            </span>
            <span className="maneuver-reading-unit">{r.unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
