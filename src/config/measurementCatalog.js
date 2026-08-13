// Every value the monitor can display. The operator chooses which of these
// appear on the numerics panel, so the catalogue carries both how to read a
// value out of the engine and how to format it.

const fmt = (v, digits = 0) => (v == null || Number.isNaN(v) ? '––' : v.toFixed(digits))

export const MEASUREMENT_CATALOG = [
  {
    id: 'ppeak', label: 'Ppeak', unit: 'cmH₂O', tone: 'paw', group: 'Pressure',
    read: ({ numerics }) => fmt(numerics.peakPressure),
  },
  {
    id: 'pplat', label: 'Pplat', unit: 'cmH₂O', tone: 'paw', group: 'Pressure',
    read: ({ numerics }) => fmt(numerics.plateauPressure),
  },
  {
    id: 'pmean', label: 'Pmean', unit: 'cmH₂O', tone: 'paw', group: 'Pressure',
    read: ({ numerics }) => fmt(numerics.meanPressure),
  },
  {
    id: 'peep', label: 'PEEP', unit: 'cmH₂O', tone: 'paw', group: 'Pressure',
    read: ({ numerics }) => fmt(numerics.peep),
  },
  {
    id: 'driving', label: 'ΔP', unit: 'cmH₂O', tone: 'paw', group: 'Pressure',
    read: ({ measurements }) => fmt(measurements.drivingPressure),
  },
  {
    id: 'vte', label: 'Vte', unit: 'mL', tone: 'volume', group: 'Volume',
    read: ({ numerics }) => fmt(numerics.tidalVolumeExhaled),
  },
  {
    id: 'mv', label: 'MV', unit: 'L/min', tone: 'volume', group: 'Volume',
    read: ({ numerics }) => fmt(numerics.minuteVolume, 1),
  },
  {
    id: 'rr', label: 'RR', unit: '/min', tone: 'flow', group: 'Timing',
    read: ({ numerics }) => fmt(numerics.measuredRR),
  },
  {
    id: 'peakflow', label: 'Peak flow', unit: 'L/min', tone: 'flow', group: 'Flow',
    read: ({ numerics }) => fmt(numerics.peakFlow),
  },
  {
    id: 'fio2', label: 'FiO₂', unit: '%', tone: 'neutral', group: 'Gas',
    read: ({ settings }) => fmt(settings.fio2),
  },
  {
    id: 'cstat', label: 'Cstat', unit: 'mL/cmH₂O', tone: 'mech', group: 'Mechanics',
    read: ({ measurements }) => fmt(measurements.cstat, 1),
  },
  {
    id: 'cdyn', label: 'Cdyn', unit: 'mL/cmH₂O', tone: 'mech', group: 'Mechanics',
    read: ({ measurements }) => fmt(measurements.cdyn, 1),
  },
  {
    id: 'rinsp', label: 'Rinsp', unit: 'cmH₂O/L/s', tone: 'mech', group: 'Mechanics',
    read: ({ measurements }) => fmt(measurements.rinsp, 1),
  },
  {
    id: 'tau', label: 'τ', unit: 's', tone: 'mech', group: 'Mechanics',
    read: ({ measurements }) => fmt(measurements.timeConstant, 2),
  },
  {
    id: 'rsbi', label: 'RSBI', unit: '/min/L', tone: 'mech', group: 'Mechanics',
    read: ({ measurements }) => fmt(measurements.rsbi),
  },
  {
    id: 'power', label: 'MP', unit: 'J/min', tone: 'mech', group: 'Mechanics',
    read: ({ measurements }) => fmt(measurements.mechanicalPower, 1),
  },
  {
    id: 'ti', label: 'Ti', unit: 's', tone: 'flow', group: 'Timing',
    read: ({ measurements }) => fmt(measurements.ti, 2),
  },
  {
    id: 'ie', label: 'I:E', unit: '', tone: 'flow', group: 'Timing',
    read: ({ measurements }) => (measurements.ieRatio == null
      ? '––' : `1:${(1 / measurements.ieRatio).toFixed(1)}`),
  },
]

export const DEFAULT_SELECTED_MEASUREMENTS = [
  'ppeak', 'pplat', 'peep', 'vte', 'mv', 'rr', 'fio2', 'cstat',
]
