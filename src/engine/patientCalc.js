// Derives starting ventilator settings from patient admission data.
//
// The relationships used here (predicted body weight from height, tidal
// volume scaled to PBW) are standard teaching formulas included to show how
// an auto-population flow would behave. They are illustrative starting
// points for a simulator, not clinical dosing guidance, and a real device
// would require the values to be reviewed and confirmed by the operator
// before ventilation starts.

export const SEX_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
]

// Devine predicted body weight, expressed for height in centimetres.
export function predictedBodyWeight({ sex, heightCm }) {
  if (!heightCm || heightCm <= 0) return null
  const heightInches = heightCm / 2.54
  const over60 = Math.max(heightInches - 60, 0)
  const base = sex === 'female' ? 45.5 : 50
  return base + 2.3 * over60
}

// Tidal volume targets are conventionally expressed per kg of predicted
// body weight; the range here spans the lung-protective band commonly
// taught, with 6 mL/kg as the default starting point.
export const TIDAL_VOLUME_PER_KG = {
  min: 4,
  default: 6,
  max: 8,
}

export function deriveSettings({ sex, heightCm, mlPerKg = TIDAL_VOLUME_PER_KG.default }) {
  const pbw = predictedBodyWeight({ sex, heightCm })
  if (pbw == null) return null

  const tidalVolume = Math.round((pbw * mlPerKg) / 10) * 10

  return {
    predictedBodyWeight: pbw,
    tidalVolume,
    respRate: 14,
    peep: 5,
    fio2: 40,
    pInsp: 15,
  }
}

export function formatPbw(pbw) {
  return pbw == null ? '—' : `${pbw.toFixed(1)} kg`
}
