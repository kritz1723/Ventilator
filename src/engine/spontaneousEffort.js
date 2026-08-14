// Spontaneous respiratory effort.
//
// The patient's inspiratory muscles generate a negative pressure that adds
// to whatever the ventilator applies. Extending the equation of motion:
//
//   P_aw = PEEP + V/C + Q*R - Pmus
//
// Pmus is modelled as a half-sine rising and falling over the neural
// inspiratory time, repeating at the patient's own rate. It is a teaching
// approximation of a drive that in reality varies breath to breath.

export const EFFORT_PRESETS = {
  none: { id: 'none', label: 'None (passive)', amplitude: 0, rate: 0 },
  weak: { id: 'weak', label: 'Weak effort', amplitude: 3, rate: 12 },
  normal: { id: 'normal', label: 'Normal effort', amplitude: 6, rate: 15 },
  strong: { id: 'strong', label: 'Strong effort', amplitude: 12, rate: 22 },
}

export const DEFAULT_EFFORT = 'none'

// Fraction of the spontaneous cycle occupied by neural inspiration.
const NEURAL_TI_FRACTION = 0.4

// Muscle pressure (cmH2O, positive magnitude) at a point in the patient's
// own respiratory cycle.
export function musclePressure({ amplitude, rate, elapsed }) {
  if (!amplitude || !rate) return 0
  const cycle = 60 / rate
  const phase = (elapsed % cycle) / cycle
  if (phase >= NEURAL_TI_FRACTION) return 0
  return amplitude * Math.sin((Math.PI * phase) / NEURAL_TI_FRACTION)
}

// A trigger is detected when the effort draws flow from the circuit beyond
// the set sensitivity. With no ventilator support, the flow the patient can
// draw is proportional to muscle pressure over airway resistance.
export function triggerFlow({ pmus, resistance }) {
  if (pmus <= 0 || resistance <= 0) return 0
  return (pmus / resistance) * 60
}

export function isTriggering({ pmus, resistance, triggerSensitivity }) {
  return triggerFlow({ pmus, resistance }) >= triggerSensitivity
}

// Detects the rising edge of a patient effort, so a breath is triggered
// once per effort rather than continuously while the effort persists.
export function detectTrigger({ wasTriggering, pmus, resistance, triggerSensitivity }) {
  const now = isTriggering({ pmus, resistance, triggerSensitivity })
  return { triggered: now && !wasTriggering, isTriggering: now }
}
