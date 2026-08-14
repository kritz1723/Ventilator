// Automatic alarm threshold derivation.
//
// Limits are derived from what the patient is currently doing, by offsetting
// each limit from the corresponding measured value. This is the "autoset"
// behaviour common on ICU ventilators: the operator asks the device to
// bracket the present state rather than dialling six limits by hand.
//
// Two design positions worth stating, because both are safety-relevant.
//
// First, a derived limit is a proposal, not an application. It is returned
// for review and applied only on acceptance, for the same reason a derived
// tidal volume is: deriving from a measurement taken at an unrepresentative
// moment would otherwise silently install the wrong limit.
//
// Second, every derived limit is clamped into a permitted band. Bracketing
// the current state too tightly produces nuisance alarms, and bracketing a
// dangerous state at all would normalise it — so an autoset high pressure
// limit is never allowed above a ceiling regardless of what the patient is
// currently generating.

// Offsets are expressed as a relative margin and an absolute margin; the
// wider of the two is used, so the bracket stays sensible at both small and
// large measured values.
export const DERIVATION = {
  highPressure: {
    label: 'High pressure',
    source: 'peakPressure',
    direction: 'above',
    relative: 0.30,
    absolute: 8,
    min: 15,
    max: 60,
    basis: 'Peak airway pressure + 30 % (at least 8 cmH₂O), capped at 60',
  },
  lowPressure: {
    label: 'Low pressure',
    source: 'peakPressure',
    direction: 'below',
    relative: 0.50,
    absolute: 5,
    min: 2,
    max: 20,
    basis: 'Peak airway pressure − 50 % (at least 5 cmH₂O), floored at 2',
  },
  highMinuteVolume: {
    label: 'High minute volume',
    source: 'minuteVolume',
    direction: 'above',
    relative: 0.40,
    absolute: 2,
    min: 3,
    max: 40,
    basis: 'Minute volume + 40 % (at least 2 L/min)',
  },
  lowMinuteVolume: {
    label: 'Low minute volume',
    source: 'minuteVolume',
    direction: 'below',
    relative: 0.40,
    absolute: 1.5,
    min: 0.5,
    max: 20,
    basis: 'Minute volume − 40 % (at least 1.5 L/min)',
  },
  lowTidalVolume: {
    label: 'Low tidal volume',
    source: 'tidalVolumeExhaled',
    direction: 'below',
    relative: 0.35,
    absolute: 50,
    min: 20,
    max: 1000,
    basis: 'Exhaled tidal volume − 35 % (at least 50 mL)',
  },
  highRespRate: {
    label: 'High rate',
    source: 'measuredRR',
    direction: 'above',
    relative: 0.50,
    absolute: 8,
    min: 15,
    max: 150,
    basis: 'Measured rate + 50 % (at least 8 /min)',
  },
}

const round = (value, key) => (
  key === 'highMinuteVolume' || key === 'lowMinuteVolume'
    ? Math.round(value * 2) / 2
    : Math.round(value)
)

// Derives one limit. Returns null when the source measurement is absent or
// not yet meaningful, so a limit is never derived from nothing.
export function deriveLimit(key, numerics) {
  const rule = DERIVATION[key]
  if (!rule) return null

  const measured = numerics?.[rule.source]
  if (measured == null || Number.isNaN(measured) || measured <= 0) return null

  const margin = Math.max(measured * rule.relative, rule.absolute)
  const raw = rule.direction === 'above' ? measured + margin : measured - margin
  const clamped = Math.min(Math.max(raw, rule.min), rule.max)
  return round(clamped, key)
}

// Derives every limit that can be derived, and reports which could not be
// and why, so an incomplete result is visible rather than silently partial.
export function deriveAll(numerics) {
  const derived = {}
  const unavailable = []

  for (const key of Object.keys(DERIVATION)) {
    const value = deriveLimit(key, numerics)
    if (value == null) unavailable.push(key)
    else derived[key] = value
  }

  return { derived, unavailable }
}

// A proposal is the derived value alongside the value it would replace, so
// the operator sees the change rather than only the outcome.
export function proposeLimits(numerics, currentLimits) {
  const { derived, unavailable } = deriveAll(numerics)
  const changes = Object.entries(derived)
    .filter(([key, value]) => value !== currentLimits?.[key])
    .map(([key, value]) => ({
      key,
      label: DERIVATION[key].label,
      basis: DERIVATION[key].basis,
      from: currentLimits?.[key],
      to: value,
    }))
  return { derived, changes, unavailable }
}
