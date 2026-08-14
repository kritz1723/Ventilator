// Oxygen delivery and simulated oximetry.
//
// Two related pieces:
//
// The oxygen flush is a timed override that delivers 100 % oxygen for a
// fixed period and then returns FiO2 to the setting it was on, used before
// disconnecting the circuit for suctioning. It is bounded rather than
// latching, because an override left on indefinitely is how a patient ends
// up on 100 % oxygen for hours without anyone deciding that.
//
// SpO2 here is a synthetic signal derived from FiO2 and ventilation. On a
// real device it comes from a separate pulse oximetry module, not from the
// ventilator's own pneumatics, and nothing in this model is calibrated
// against measured patient data. It exists to show the shape of the
// relationship — that oxygenation follows FiO2 with a lag, and falls when
// ventilation is inadequate — not to predict a value.

export const FLUSH_DURATION_SECONDS = 120
export const FLUSH_FIO2 = 100

export function startFlush(now = Date.now()) {
  return { startedAt: now, endsAt: now + FLUSH_DURATION_SECONDS * 1000 }
}

export function flushRemaining(flush, now = Date.now()) {
  if (!flush) return 0
  return Math.max(0, Math.ceil((flush.endsAt - now) / 1000))
}

export function isFlushActive(flush, now = Date.now()) {
  return Boolean(flush) && now < flush.endsAt
}

// The FiO2 actually being delivered, which is the override while the flush
// runs and the set value otherwise. Settings are never mutated by the
// flush, so it cannot leave the set value changed behind it.
export function effectiveFio2(settings, flush, now = Date.now()) {
  return isFlushActive(flush, now) ? FLUSH_FIO2 : settings.fio2
}

// Rough alveolar oxygen tension via the alveolar gas equation, at sea level
// with a respiratory quotient of 0.8 and an assumed normal arterial CO2.
const ATMOSPHERIC = 760
const WATER_VAPOUR = 47
const RQ = 0.8

export function alveolarPO2(fio2Percent, paco2 = 40) {
  return (fio2Percent / 100) * (ATMOSPHERIC - WATER_VAPOUR) - paco2 / RQ
}

// Severinghaus dissociation relationship, converting an oxygen tension to a
// saturation. Standard curve; not patient specific.
export function saturationFor(po2) {
  if (po2 <= 0) return 0
  const s = 1 / (23400 / (po2 ** 3 + 150 * po2) + 1)
  return Math.min(Math.max(s * 100, 0), 100)
}

// Ventilation shifts arterial CO2: below the reference minute volume CO2
// rises, above it falls, which in turn moves alveolar oxygen.
export function estimatedPaco2(minuteVolume, referenceMV = 6) {
  if (!(minuteVolume > 0)) return 90
  const ratio = referenceMV / minuteVolume
  return Math.min(Math.max(40 * ratio, 20), 100)
}

// A shunt fraction stands in for the gas exchange defect of the simulated
// lung: a stiffer lung oxygenates less well at the same FiO2.
export function shuntPenaltyFor(compliance) {
  if (compliance >= 50) return 0
  if (compliance <= 15) return 12
  return ((50 - compliance) / 35) * 12
}

export function targetSpo2({ fio2, minuteVolume, compliance }) {
  const paco2 = estimatedPaco2(minuteVolume)
  const pao2 = alveolarPO2(fio2, paco2)
  const saturation = saturationFor(pao2)
  return Math.min(Math.max(saturation - shuntPenaltyFor(compliance), 0), 100)
}

// Saturation does not follow a change in inspired oxygen instantly; it
// approaches the new value with a time constant of roughly half a minute.
const SPO2_TAU_SECONDS = 30

export function stepSpo2(current, target, dt) {
  if (current == null) return target
  const alpha = 1 - Math.exp(-dt / SPO2_TAU_SECONDS)
  return current + (target - current) * alpha
}
