const FIELDS = [
  { key: 'ppeak', label: 'Ppeak', unit: 'cmH₂O', tone: 'paw', get: (n) => n.peakPressure.toFixed(0) },
  { key: 'pplat', label: 'Pplat', unit: 'cmH₂O', tone: 'paw', get: (n) => n.plateauPressure.toFixed(0) },
  { key: 'peep', label: 'PEEP', unit: 'cmH₂O', tone: 'paw', get: (n) => n.peep.toFixed(0) },
  { key: 'vte', label: 'Vte', unit: 'mL', tone: 'volume', get: (n) => n.tidalVolumeExhaled.toFixed(0) },
  { key: 'mv', label: 'MV', unit: 'L/min', tone: 'volume', get: (n) => n.minuteVolume.toFixed(1) },
]

export default function NumericsPanel({ numerics, settings }) {
  return (
    <div className="numerics-panel panel">
      <div className="panel-header">
        <span className="panel-title">Monitored values</span>
      </div>
      <div className="numerics-grid">
        {FIELDS.map((f) => (
          <div key={f.key} className={`numeric numeric-${f.tone}`}>
            <span className="numeric-label">{f.label}</span>
            <span className="numeric-value tnum">{f.get(numerics)}</span>
            <span className="numeric-unit">{f.unit}</span>
          </div>
        ))}
        <div className="numeric numeric-flow">
          <span className="numeric-label">RR</span>
          <span className="numeric-value tnum">{numerics.measuredRR.toFixed(0)}</span>
          <span className="numeric-unit">set {settings.respRate} /min</span>
        </div>
        <div className="numeric numeric-neutral">
          <span className="numeric-label">FiO₂</span>
          <span className="numeric-value tnum">{settings.fio2.toFixed(0)}</span>
          <span className="numeric-unit">%</span>
        </div>
      </div>
    </div>
  )
}
