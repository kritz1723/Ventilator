// Units of measure.
//
// Every physical quantity is held internally in one canonical unit and
// converted only at the point of display. Converting in more than one place
// admits double conversion, which produces a plausible but wrong value —
// the failure mode this structure exists to prevent.
//
// Canonical units:
//   pressure  cmH2O
//   volume    mL
//   length    cm
//   weight    kg
//   flow      L/min
//
// A unit is never implied. Every formatted value carries the unit in force,
// because an unlabelled number is a classic source of order-of-magnitude
// error.

export const QUANTITY = {
  PRESSURE: 'pressure',
  VOLUME: 'volume',
  LENGTH: 'length',
  WEIGHT: 'weight',
  FLOW: 'flow',
}

// factor converts canonical -> display. decimals is the display precision.
export const UNIT_SYSTEMS = {
  [QUANTITY.PRESSURE]: {
    label: 'Pressure',
    canonical: 'cmH2O',
    options: {
      cmH2O: { id: 'cmH2O', label: 'cmH₂O', factor: 1, decimals: 0 },
      // 1 cmH2O = 0.980665 hPa (and hPa is numerically equal to mbar).
      hPa: { id: 'hPa', label: 'hPa', factor: 0.980665, decimals: 1 },
      mbar: { id: 'mbar', label: 'mbar', factor: 0.980665, decimals: 1 },
      mmHg: { id: 'mmHg', label: 'mmHg', factor: 0.735559, decimals: 1 },
    },
  },
  [QUANTITY.VOLUME]: {
    label: 'Volume',
    canonical: 'mL',
    options: {
      mL: { id: 'mL', label: 'mL', factor: 1, decimals: 0 },
      L: { id: 'L', label: 'L', factor: 0.001, decimals: 3 },
    },
  },
  [QUANTITY.LENGTH]: {
    label: 'Height',
    canonical: 'cm',
    options: {
      cm: { id: 'cm', label: 'cm', factor: 1, decimals: 0 },
      in: { id: 'in', label: 'in', factor: 1 / 2.54, decimals: 1 },
    },
  },
  [QUANTITY.WEIGHT]: {
    label: 'Weight',
    canonical: 'kg',
    options: {
      kg: { id: 'kg', label: 'kg', factor: 1, decimals: 1 },
      lb: { id: 'lb', label: 'lb', factor: 2.2046226218, decimals: 1 },
    },
  },
  [QUANTITY.FLOW]: {
    label: 'Flow',
    canonical: 'L/min',
    options: {
      'L/min': { id: 'L/min', label: 'L/min', factor: 1, decimals: 1 },
      'mL/s': { id: 'mL/s', label: 'mL/s', factor: 1000 / 60, decimals: 0 },
    },
  },
}

export const DEFAULT_UNITS = Object.fromEntries(
  Object.entries(UNIT_SYSTEMS).map(([q, sys]) => [q, sys.canonical]),
)

export function unitFor(units, quantity) {
  const sys = UNIT_SYSTEMS[quantity]
  if (!sys) return null
  return sys.options[units?.[quantity]] ?? sys.options[sys.canonical]
}

// Canonical -> display.
export function toDisplay(value, units, quantity) {
  if (value == null || Number.isNaN(value)) return null
  const unit = unitFor(units, quantity)
  return value * unit.factor
}

// Display -> canonical. Used when an operator types a value in the unit
// currently in force; the value is normalised on the way in so the rest of
// the system only ever sees canonical units.
export function toCanonical(value, units, quantity) {
  if (value == null || Number.isNaN(value)) return null
  const unit = unitFor(units, quantity)
  return value / unit.factor
}

// Formats a canonical value for display, always with its unit.
export function format(value, units, quantity, { withUnit = true } = {}) {
  const unit = unitFor(units, quantity)
  const converted = toDisplay(value, units, quantity)
  if (converted == null) return withUnit ? `–– ${unit.label}` : '––'
  const text = converted.toFixed(unit.decimals)
  return withUnit ? `${text} ${unit.label}` : text
}

export function unitLabel(units, quantity) {
  return unitFor(units, quantity).label
}

export function setUnit(units, quantity, unitId) {
  const sys = UNIT_SYSTEMS[quantity]
  if (!sys || !sys.options[unitId]) return units
  return { ...units, [quantity]: unitId }
}
