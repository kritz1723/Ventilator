// Catalogue of traces the waveform area can display.
//
// Each entry knows how to read its channel out of a waveform sample and
// carries a set of selectable Y scales. Keeping scales as an explicit list
// rather than a free numeric range keeps the axis labels readable and the
// choices meaningful.

export const TRACE_CATALOG = {
  pressure: {
    id: 'pressure',
    key: 'pressure',
    label: 'Paw',
    name: 'Airway pressure',
    unit: 'cmH₂O',
    token: '--paw',
    scales: [
      { label: '0–20', min: -2, max: 20 },
      { label: '0–40', min: -5, max: 40 },
      { label: '0–60', min: -5, max: 60 },
      { label: '0–80', min: -10, max: 80 },
    ],
    defaultScale: 1,
  },
  flow: {
    id: 'flow',
    key: 'flow',
    label: 'Flow',
    name: 'Flow',
    unit: 'L/min',
    token: '--flow',
    scales: [
      { label: '±30', min: -30, max: 30 },
      { label: '±60', min: -60, max: 60 },
      { label: '±150', min: -150, max: 150 },
      { label: '±250', min: -250, max: 250 },
    ],
    defaultScale: 2,
  },
  volume: {
    id: 'volume',
    key: 'volume',
    label: 'Volume',
    name: 'Volume',
    unit: 'mL',
    token: '--volume',
    scales: [
      { label: '0–100', min: 0, max: 100 },
      { label: '0–400', min: 0, max: 400 },
      { label: '0–800', min: 0, max: 800 },
      { label: '0–2000', min: 0, max: 2000 },
    ],
    defaultScale: 2,
  },
  // Derived channel: alveolar pressure is not what the airway sensor reads,
  // and showing it alongside Paw makes the resistive drop visible.
  paw_alv: {
    id: 'paw_alv',
    key: 'alveolar',
    label: 'Palv',
    name: 'Alveolar pressure (derived)',
    unit: 'cmH₂O',
    token: '--mech',
    scales: [
      { label: '0–20', min: -2, max: 20 },
      { label: '0–40', min: -5, max: 40 },
      { label: '0–60', min: -5, max: 60 },
    ],
    defaultScale: 1,
  },
}

export const SWEEP_OPTIONS = [5, 10, 15, 20, 30]
export const DEFAULT_SWEEP_SECONDS = 10

export const MIN_TRACES = 1
export const MAX_TRACES = 6

// A channel may occupy more than one slot, which is how the same signal can
// be shown at two scales at once — a full-range trace beside a zoomed one.

export const DEFAULT_LAYOUT = {
  sweepSeconds: DEFAULT_SWEEP_SECONDS,
  traces: [
    { id: 'pressure', scale: TRACE_CATALOG.pressure.defaultScale },
    { id: 'flow', scale: TRACE_CATALOG.flow.defaultScale },
    { id: 'volume', scale: TRACE_CATALOG.volume.defaultScale },
  ],
}

export function scaleFor(traceId, index) {
  const entry = TRACE_CATALOG[traceId]
  if (!entry) return { min: 0, max: 1, label: '' }
  return entry.scales[Math.min(Math.max(index, 0), entry.scales.length - 1)]
}

export function moveTrace(traces, from, to) {
  if (to < 0 || to >= traces.length) return traces
  const next = [...traces]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
