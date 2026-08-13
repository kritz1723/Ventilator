// Illustrative patient lung-mechanics presets for the simulator.
// These values are approximate teaching examples, not clinically
// validated or sourced from a specific patient population.
export const PATIENT_PRESETS = {
  normal: {
    label: 'Normal',
    compliance: 50, // mL/cmH2O
    resistance: 8, // cmH2O/L/s
  },
  ards: {
    label: 'ARDS (illustrative)',
    compliance: 20,
    resistance: 12,
  },
  copd: {
    label: 'COPD (illustrative)',
    compliance: 60,
    resistance: 25,
  },
  fibrosis: {
    label: 'Pulmonary fibrosis (illustrative)',
    compliance: 15,
    resistance: 9,
  },
}

export const DEFAULT_PATIENT_PRESET = 'normal'
