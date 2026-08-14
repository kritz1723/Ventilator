import { useEffect, useRef } from 'react'

const LABELS = {
  respRate: ['Rate', '/min'],
  tidalVolume: ['Tidal volume', 'mL'],
  pInsp: ['Inspiratory pressure', 'cmH₂O'],
  peep: ['PEEP', 'cmH₂O'],
  fio2: ['FiO₂', '%'],
  pauseTime: ['Inspiratory pause', 's'],
  triggerFlow: ['Trigger', 'L/min'],
  flowPattern: ['Flow pattern', ''],
  pSupport: ['Pressure support', 'cmH₂O'],
  cycleOffPercent: ['Cycle off', '%'],
  highPressure: ['High pressure limit', 'cmH₂O'],
  lowPressure: ['Low pressure limit', 'cmH₂O'],
  highMinuteVolume: ['High MV limit', 'L/min'],
  lowMinuteVolume: ['Low MV limit', 'L/min'],
  lowTidalVolume: ['Low Vt limit', 'mL'],
  highRespRate: ['High rate limit', '/min'],
}

// Saving is the moment a change reaches the patient, so it is confirmed
// against an itemised list rather than a count. The operator should be able
// to check each value they are about to commit, not just agree that some
// number of things changed.
export default function SaveConfirmDialog({ open, changes, ventilating, onConfirm, onBack }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    confirmRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onBack() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onBack])

  if (!open) return null

  const settingChanges = changes.filter((c) => c.group === 'setting')
  const limitChanges = changes.filter((c) => c.group === 'alarmLimit')

  const renderGroup = (title, list) => (
    list.length > 0 && (
      <div className="save-group">
        <span className="save-group-title">{title}</span>
        <ul className="save-list">
          {list.map((c) => {
            const [label, unit] = LABELS[c.key] ?? [c.key, '']
            const suffix = unit ? ` ${unit}` : ''
            return (
              <li key={`${c.group}-${c.key}`} className="save-item">
                <span className="save-key">{label}</span>
                <span className="save-change tnum">
                  <span className="save-from">{String(c.from)}{suffix}</span>
                  <span className="save-arrow">→</span>
                  <span className="save-to">{String(c.to)}{suffix}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  )

  return (
    <div className="confirm-backdrop" role="presentation" onClick={onBack}>
      <div
        className="confirm-dialog save-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="save-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="save-title">
          Save {changes.length} {changes.length === 1 ? 'change' : 'changes'}?
        </h2>
        <p className="confirm-body">
          {ventilating
            ? 'These values will be delivered to the patient from the next breath.'
            : 'These values will be used when ventilation starts.'}
        </p>

        <div className="save-body">
          {renderGroup('Ventilation settings', settingChanges)}
          {renderGroup('Alarm limits', limitChanges)}
        </div>

        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
          <button
            type="button"
            ref={confirmRef}
            className="btn btn-accept"
            onClick={onConfirm}
          >Confirm and save</button>
        </div>
      </div>
    </div>
  )
}
