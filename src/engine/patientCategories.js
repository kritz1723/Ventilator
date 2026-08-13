// Patient categories change the plausible range and default value of every
// setting. The numbers here are illustrative teaching defaults chosen to
// make the simulator behave sensibly across body sizes — they are not
// clinical reference ranges.

export const PATIENT_CATEGORIES = {
  adult: {
    id: 'adult',
    label: 'Adult',
    ranges: {
      tidalVolume: { min: 200, max: 1000, step: 10 },
      respRate: { min: 5, max: 40, step: 1 },
      pInsp: { min: 5, max: 45, step: 1 },
      peep: { min: 0, max: 25, step: 1 },
    },
    defaults: { tidalVolume: 450, respRate: 14, pInsp: 15, peep: 5 },
  },
  paediatric: {
    id: 'paediatric',
    label: 'Paediatric',
    ranges: {
      tidalVolume: { min: 50, max: 400, step: 5 },
      respRate: { min: 10, max: 50, step: 1 },
      pInsp: { min: 5, max: 35, step: 1 },
      peep: { min: 0, max: 20, step: 1 },
    },
    defaults: { tidalVolume: 150, respRate: 22, pInsp: 14, peep: 5 },
  },
  neonatal: {
    id: 'neonatal',
    label: 'Neonatal',
    ranges: {
      tidalVolume: { min: 5, max: 60, step: 1 },
      respRate: { min: 20, max: 80, step: 1 },
      pInsp: { min: 5, max: 30, step: 1 },
      peep: { min: 0, max: 15, step: 1 },
    },
    defaults: { tidalVolume: 20, respRate: 40, pInsp: 14, peep: 5 },
  },
}

export const DEFAULT_CATEGORY = 'adult'

export function rangeFor(categoryId, settingKey) {
  const cat = PATIENT_CATEGORIES[categoryId] ?? PATIENT_CATEGORIES[DEFAULT_CATEGORY]
  return cat.ranges[settingKey]
}
