import { useState } from 'react'
import {
  FEATURES, TIER, TIER_LABEL, LicenceError, isEnabled, setFeature, applyTier,
} from '../config/licensing.js'

export default function LicensingTab({ licence, onLicenceChange, canEdit, blockedReason }) {
  const [error, setError] = useState(null)

  const toggle = (id) => {
    setError(null)
    try {
      onLicenceChange(setFeature(licence, id, !isEnabled(licence, id)))
    } catch (e) {
      if (e instanceof LicenceError) setError(e.message)
      else throw e
    }
  }

  const grouped = Object.values(TIER).map((tier) => ({
    tier,
    features: Object.values(FEATURES).filter((f) => f.tier === tier),
  }))

  return (
    <>
      <div className="doc-toolbar">
        <span className="doc-note-inline">
          Licensing is a commercial boundary, not a safety one. Features marked
          required cannot be disabled by any configuration action.
        </span>
      </div>

      {!canEdit && (
        <p className="licence-blocked" role="status">{blockedReason}</p>
      )}

      {error && <p className="licence-error" role="alert">{error}</p>}

      <div className="doc-toolbar">
        <span className="field-label">Apply a tier</span>
        {Object.values(TIER).map((t) => (
          <button
            key={t}
            type="button"
            className="facet"
            disabled={!canEdit}
            onClick={() => { setError(null); onLicenceChange(applyTier(licence, t)) }}
          >{TIER_LABEL[t]}</button>
        ))}
      </div>

      <div className="doc-list">
        {grouped.map(({ tier, features }) => (
          <section key={tier} className="licence-group">
            <h3 className="licence-tier">{TIER_LABEL[tier]}</h3>
            {features.map((f) => {
              const on = isEnabled(licence, f.id)
              return (
                <div key={f.id} className={on ? 'licence-row on' : 'licence-row'}>
                  <div className="licence-info">
                    <span className="licence-name">
                      {f.label}
                      {f.mandatory && <span className="licence-required">Required</span>}
                    </span>
                    <span className="licence-desc">{f.description}</span>
                    {f.modes && (
                      <span className="licence-modes">
                        Gates: {f.modes.join(', ')}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={f.label}
                    className={on ? 'licence-switch on' : 'licence-switch'}
                    disabled={!canEdit || f.mandatory}
                    onClick={() => toggle(f.id)}
                  >
                    <span className="licence-knob" />
                  </button>
                </div>
              )
            })}
          </section>
        ))}
      </div>
    </>
  )
}
