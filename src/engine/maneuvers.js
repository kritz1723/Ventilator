// Inspiratory and expiratory hold maneuvers.
//
// An inspiratory hold closes both valves at end inspiration; airway pressure
// equilibrates with alveolar pressure, giving plateau pressure and hence
// static compliance.
//
// An expiratory hold closes both valves at end expiration; airway pressure
// rises to whatever pressure remains trapped in the lung, giving total PEEP.
// The difference between total PEEP and set PEEP is intrinsic (auto) PEEP,
// which is the main reason the maneuver exists.

export const MANEUVER = {
  NONE: null,
  INSPIRATORY_HOLD: 'inspHold',
  EXPIRATORY_HOLD: 'expHold',
}

export const HOLD_DURATION_SECONDS = 3

// During a hold there is no flow, so airway pressure equals the elastic
// recoil pressure of the gas still in the lung above FRC, plus PEEP.
export function holdPressure({ volume, compliance, peep }) {
  return peep + volume / compliance
}

export function maneuverResult({ type, volume, compliance, peep }) {
  const pressure = holdPressure({ volume, compliance, peep })

  if (type === MANEUVER.INSPIRATORY_HOLD) {
    const driving = pressure - peep
    return {
      type,
      label: 'Inspiratory hold',
      readings: [
        { label: 'Pplat', value: pressure, unit: 'cmH₂O', digits: 1 },
        { label: 'ΔP', value: driving, unit: 'cmH₂O', digits: 1 },
        {
          label: 'Cstat',
          value: driving > 0 ? volume / driving : null,
          unit: 'mL/cmH₂O',
          digits: 1,
        },
      ],
    }
  }

  const totalPeep = pressure
  const autoPeep = Math.max(totalPeep - peep, 0)
  return {
    type,
    label: 'Expiratory hold',
    readings: [
      { label: 'PEEPtot', value: totalPeep, unit: 'cmH₂O', digits: 1 },
      { label: 'PEEPset', value: peep, unit: 'cmH₂O', digits: 1 },
      { label: 'PEEPi', value: autoPeep, unit: 'cmH₂O', digits: 1 },
    ],
  }
}
