const LABELS = {
  respRate: ['Rate', '/min'],
  tidalVolume: ['Tidal volume', 'mL'],
  pInsp: ['P insp.', 'cmH₂O'],
  peep: ['PEEP', 'cmH₂O'],
  fio2: ['FiO₂', '%'],
  pauseTime: ['Insp. pause', 's'],
  triggerFlow: ['Trigger', 'L/min'],
  flowPattern: ['Flow pattern', ''],
  highPressure: ['P high', 'cmH₂O'],
  lowPressure: ['P low', 'cmH₂O'],
  highMinuteVolume: ['MV high', 'L/min'],
  lowMinuteVolume: ['MV low', 'L/min'],
  lowTidalVolume: ['Vt low', 'mL'],
  highRespRate: ['Rate high', '/min'],
}

export default function PendingChangesBar({ changes, onAccept, onCancel }) {
  if (!changes.length) return null

  return (
    <div className="pending-bar" role="status">
      <div className="pending-summary">
        <span className="pending-count">{changes.length}</span>
        <span className="pending-label">
          {changes.length === 1 ? 'change awaiting acceptance' : 'changes awaiting acceptance'}
        </span>
      </div>

      <ul className="pending-list">
        {changes.map((c) => {
          const [label, unit] = LABELS[c.key] ?? [c.key, '']
          const suffix = unit ? ` ${unit}` : ''
          return (
            <li key={`${c.group}-${c.key}`} className="pending-item">
              <span className="pending-key">{label}</span>
              <span className="pending-from tnum">{String(c.from)}{suffix}</span>
              <span className="pending-arrow">→</span>
              <span className="pending-to tnum">{String(c.to)}{suffix}</span>
            </li>
          )
        })}
      </ul>

      <div className="pending-actions">
        <button type="button" className="btn btn-ghost btn-tiny" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-accept btn-tiny" onClick={onAccept}>Accept</button>
      </div>
    </div>
  )
}
