// Patient categories bound the permitted range of every setting.
//
// The ranges below are a deliberately vendor-neutral composite, chosen to
// span what is typical across current commercial ICU ventilators rather
// than to replicate any single product. They are approximations assembled
// for teaching purposes from manufacturer datasheets and secondary
// sources, and are not clinically authoritative — a real device derives
// its ranges from its own risk analysis and verifies them against its own
// hardware.
//
// Composite basis:
//   Tidal volume  adult 100-2000 mL, paediatric 20-350 mL, neonatal 2-100 mL
//   Rate          1-100 /min, extended to 150 /min for neonatal
//   PEEP          0-50 cmH2O in 1 cmH2O steps
//   FiO2          21-100% in 1% steps (handled outside the category table)

export const PATIENT_CATEGORIES = {
  adult: {
    id: 'adult',
    label: 'Adult',
    ranges: {
      tidalVolume: { min: 100, max: 2000, step: 10 },
      respRate: { min: 1, max: 100, step: 1 },
      pInsp: { min: 5, max: 60, step: 1 },
      peep: { min: 0, max: 50, step: 1 },
    },
    defaults: { tidalVolume: 450, respRate: 14, pInsp: 15, peep: 5 },
  },
  paediatric: {
    id: 'paediatric',
    label: 'Paediatric',
    ranges: {
      tidalVolume: { min: 20, max: 350, step: 5 },
      respRate: { min: 1, max: 100, step: 1 },
      pInsp: { min: 5, max: 50, step: 1 },
      peep: { min: 0, max: 50, step: 1 },
    },
    defaults: { tidalVolume: 150, respRate: 22, pInsp: 14, peep: 5 },
  },
  neonatal: {
    id: 'neonatal',
    label: 'Neonatal',
    ranges: {
      tidalVolume: { min: 2, max: 100, step: 1 },
      respRate: { min: 1, max: 150, step: 1 },
      pInsp: { min: 5, max: 40, step: 1 },
      peep: { min: 0, max: 30, step: 1 },
    },
    defaults: { tidalVolume: 20, respRate: 40, pInsp: 14, peep: 5 },
  },
}

export const DEFAULT_CATEGORY = 'adult'

// Ranges that do not vary by patient category.
export const COMMON_RANGES = {
  fio2: { min: 21, max: 100, step: 1 },
  // Peak inspiratory flow spans roughly 3-150 L/min across current devices;
  // used to scale the flow waveform rather than as a directly set value.
  peakFlow: { min: 3, max: 150 },
}

export function rangeFor(categoryId, settingKey) {
  const cat = PATIENT_CATEGORIES[categoryId] ?? PATIENT_CATEGORIES[DEFAULT_CATEGORY]
  return cat.ranges[settingKey] ?? COMMON_RANGES[settingKey]
}
