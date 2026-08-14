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

// Maximum hold durations.
//
// A hold interrupts ventilation, so it must end on its own rather than
// depending on the operator to release it. Each is therefore bounded and
// auto-releases at its maximum.
//
// These durations are illustrative, chosen to be defensible rather than
// cited: an inspiratory hold is kept short because it suspends delivery,
// while an expiratory hold is allowed longer because trapped gas needs time
// to equilibrate before total PEEP can be read. I could not find a standard
// that fixes these numbers — a real device would derive and justify its own,
// and both are configurable here so a sourced value can replace them.
export const HOLD_LIMITS = {
  inspHold: { maxSeconds: 5, label: 'Inspiratory hold' },
  expHold: { maxSeconds: 15, label: 'Expiratory hold' },
}

// Retained for the default engagement duration when no explicit release
// occurs; superseded per maneuver by HOLD_LIMITS.
export const HOLD_DURATION_SECONDS = 3

export function maxHoldSeconds(type) {
  return HOLD_LIMITS[type]?.maxSeconds ?? HOLD_DURATION_SECONDS
}

export function holdRemaining(type, elapsed) {
  return Math.max(0, maxHoldSeconds(type) - elapsed)
}

export function shouldAutoRelease(type, elapsed) {
  return elapsed >= maxHoldSeconds(type)
}

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
