function Numeric({ label, value, unit }) {
  return (
    <div className="numeric">
      <span className="numeric-label">{label}</span>
      <span className="numeric-value">{value}</span>
      <span className="numeric-unit">{unit}</span>
    </div>
  )
}

export default function NumericsPanel({ numerics, settings }) {
  return (
    <div className="numerics-panel">
      <Numeric label="Ppeak" value={numerics.peakPressure.toFixed(0)} unit="cmH2O" />
      <Numeric label="Pplat" value={numerics.plateauPressure.toFixed(0)} unit="cmH2O" />
      <Numeric label="PEEP" value={numerics.peep.toFixed(0)} unit="cmH2O" />
      <Numeric label="Vte" value={numerics.tidalVolumeExhaled.toFixed(0)} unit="mL" />
      <Numeric label="MV" value={numerics.minuteVolume.toFixed(1)} unit="L/min" />
      <Numeric label="RR (set / meas.)" value={`${settings.respRate} / ${numerics.measuredRR.toFixed(0)}`} unit="/min" />
      <Numeric label="FiO2" value={settings.fio2.toFixed(0)} unit="%" />
    </div>
  )
}
