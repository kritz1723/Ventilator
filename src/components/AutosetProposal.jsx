import { DERIVATION } from '../engine/autoThresholds.js'

// The proposal is shown before it is applied, for the same reason a derived
// tidal volume is: a limit derived from an unrepresentative moment would
// otherwise be installed without anyone seeing it.
export default function AutosetProposal({ proposal, onAccept, onCancel }) {
  if (!proposal) return null
  const { changes, unavailable } = proposal

  return (
    <div className="autoset-panel panel" role="dialog" aria-label="Proposed alarm limits">
      <div className="autoset-head">
        <span className="panel-title">Proposed alarm limits</span>
        <span className="autoset-note">Derived from the current measurements</span>
      </div>

      {changes.length === 0 ? (
        <p className="autoset-empty">
          The current limits already match what would be derived. Nothing to change.
        </p>
      ) : (
        <ul className="autoset-list">
          {changes.map((c) => (
            <li key={c.key} className="autoset-item">
              <div className="autoset-item-head">
                <span className="autoset-label">{c.label}</span>
                <span className="autoset-change tnum">
                  <span className="autoset-from">{c.from ?? '––'}</span>
                  <span className="autoset-arrow">→</span>
                  <span className="autoset-to">{c.to}</span>
                </span>
              </div>
              <span className="autoset-basis">{c.basis}</span>
            </li>
          ))}
        </ul>
      )}

      {unavailable.length > 0 && (
        <p className="autoset-unavailable">
          Not derived, because the measurement is not yet available:{' '}
          {unavailable.map((k) => DERIVATION[k].label).join(', ')}.
        </p>
      )}

      <div className="autoset-actions">
        <button type="button" className="btn btn-ghost btn-tiny" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="btn btn-accept btn-tiny"
          disabled={changes.length === 0}
          onClick={onAccept}
        >Apply limits</button>
      </div>
    </div>
  )
}
