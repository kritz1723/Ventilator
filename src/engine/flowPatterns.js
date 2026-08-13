// Inspiratory flow patterns for volume-controlled breaths.
//
// Each pattern is defined by a normalised shape function s(x) over the
// inspiratory flow time (x from 0 to 1), plus the peak-flow multiplier k
// needed for the area under the curve to equal the set tidal volume:
//
//   mean flow = Vt / Ti,  peak flow = k * mean flow
//
// so that ∫s(x)dx = 1/k. Getting k right is what makes each pattern deliver
// the same tidal volume with a correctly shaped waveform.

export const FLOW_PATTERNS = {
  square: {
    id: 'square',
    label: 'Square',
    description: 'Constant flow — shortest inspiratory time for a given Vt.',
    peakFactor: 1,
    shape: () => 1,
  },
  decelerating: {
    id: 'decelerating',
    label: 'Decelerating',
    description: 'Ramp down — lower peak pressure, more even distribution.',
    peakFactor: 2,
    shape: (x) => Math.max(1 - x, 0),
  },
  accelerating: {
    id: 'accelerating',
    label: 'Accelerating',
    description: 'Ramp up — flow rises through inspiration.',
    peakFactor: 2,
    shape: (x) => Math.min(x, 1),
  },
  sine: {
    id: 'sine',
    label: 'Sine',
    description: 'Sinusoidal — smooth acceleration and decay.',
    peakFactor: Math.PI / 2,
    shape: (x) => Math.sin(Math.PI * x),
  },
}

export const DEFAULT_FLOW_PATTERN = 'square'

// Instantaneous inspiratory flow (L/min) at fraction `x` through the flow
// phase, for a given tidal volume (mL) and flow time (s).
export function inspiratoryFlow({ patternId, x, tidalVolume, flowTime }) {
  if (flowTime <= 0) return 0
  const pattern = FLOW_PATTERNS[patternId] ?? FLOW_PATTERNS[DEFAULT_FLOW_PATTERN]
  const meanFlowLpm = (tidalVolume / 1000) / (flowTime / 60)
  return meanFlowLpm * pattern.peakFactor * pattern.shape(Math.min(Math.max(x, 0), 1))
}
