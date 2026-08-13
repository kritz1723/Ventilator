// Alarm condition evaluation, structured around the priority model that
// IEC 60601-1-8 describes for medical electrical equipment.
//
// Priority drives both colour and flash rate in the UI:
//   high   — red,    flashing, operator response required immediately
//   medium — yellow, flashing, prompt operator response required
//   low    — cyan,   steady,   operator awareness required
//
// The conditions and default limits below are illustrative teaching
// examples for a simulator. A real device derives its alarm set, limits,
// delays and priorities from its own risk analysis.

export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

export const PRIORITY_RANK = { high: 3, medium: 2, low: 1 }

export const APNEA_TIMEOUT_SECONDS = 20

// Audio pause duration. 60601-1-8 bounds how long an alarm signal may be
// silenced; two minutes is a common device default.
export const AUDIO_PAUSE_SECONDS = 120

function condition(id, priority, label, message, detail) {
  return { id, priority, label, message, detail }
}

export function evaluateAlarms({
  peakPressure,
  minuteVolume = null,
  tidalVolumeExhaled = null,
  measuredRR = null,
  alarmLimits,
  timeSinceLastBreath,
  ventilating = true,
  technical = {},
}) {
  const active = []

  if (!ventilating) {
    // In standby the patient is not connected, so patient alarms are
    // inhibited; only technical conditions remain relevant.
    return technicalAlarms(technical)
  }

  if (peakPressure >= alarmLimits.highPressure) {
    active.push(
      condition('high-pressure', PRIORITY.HIGH, 'High Paw',
        `High airway pressure ${peakPressure.toFixed(0)} cmH₂O`,
        `Limit ${alarmLimits.highPressure} cmH₂O`),
    )
  }

  if (alarmLimits.lowPressure != null && peakPressure < alarmLimits.lowPressure) {
    active.push(
      condition('low-pressure', PRIORITY.HIGH, 'Low Paw',
        `Low airway pressure ${peakPressure.toFixed(0)} cmH₂O — check for disconnection`,
        `Limit ${alarmLimits.lowPressure} cmH₂O`),
    )
  }

  if (timeSinceLastBreath >= APNEA_TIMEOUT_SECONDS) {
    active.push(
      condition('apnea', PRIORITY.HIGH, 'Apnea',
        `No breath detected for ${timeSinceLastBreath.toFixed(0)} s`,
        `Apnea time ${APNEA_TIMEOUT_SECONDS} s`),
    )
  }

  if (minuteVolume != null && alarmLimits.highMinuteVolume != null
      && minuteVolume > alarmLimits.highMinuteVolume) {
    active.push(
      condition('high-mv', PRIORITY.MEDIUM, 'High MV',
        `High minute volume ${minuteVolume.toFixed(1)} L/min`,
        `Limit ${alarmLimits.highMinuteVolume} L/min`),
    )
  }

  if (minuteVolume != null && alarmLimits.lowMinuteVolume != null
      && minuteVolume < alarmLimits.lowMinuteVolume) {
    active.push(
      condition('low-mv', PRIORITY.MEDIUM, 'Low MV',
        `Low minute volume ${minuteVolume.toFixed(1)} L/min`,
        `Limit ${alarmLimits.lowMinuteVolume} L/min`),
    )
  }

  if (tidalVolumeExhaled != null && alarmLimits.lowTidalVolume != null
      && tidalVolumeExhaled < alarmLimits.lowTidalVolume) {
    active.push(
      condition('low-vte', PRIORITY.MEDIUM, 'Low Vte',
        `Low exhaled tidal volume ${tidalVolumeExhaled.toFixed(0)} mL`,
        `Limit ${alarmLimits.lowTidalVolume} mL`),
    )
  }

  if (measuredRR != null && alarmLimits.highRespRate != null
      && measuredRR > alarmLimits.highRespRate) {
    active.push(
      condition('high-rr', PRIORITY.MEDIUM, 'High rate',
        `High respiratory rate ${measuredRR.toFixed(0)} /min`,
        `Limit ${alarmLimits.highRespRate} /min`),
    )
  }

  return [...active, ...technicalAlarms(technical)].sort(
    (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
  )
}

function technicalAlarms({ batteryLow, oxygenSupply, preUseCheckDue } = {}) {
  const active = []

  if (oxygenSupply === 'failed') {
    active.push(
      condition('o2-supply', PRIORITY.HIGH, 'O₂ supply',
        'Oxygen supply pressure lost', 'Technical alarm'),
    )
  }

  if (batteryLow) {
    active.push(
      condition('battery-low', PRIORITY.MEDIUM, 'Battery',
        'Operating on battery — charge low', 'Technical alarm'),
    )
  }

  if (preUseCheckDue) {
    active.push(
      condition('pre-use-check', PRIORITY.LOW, 'Pre-use check',
        'Pre-use check has not been completed', 'Informational'),
    )
  }

  return active
}

export function highestPriority(alarms) {
  if (alarms.length === 0) return null
  return alarms.reduce((worst, a) => (
    PRIORITY_RANK[a.priority] > PRIORITY_RANK[worst] ? a.priority : worst
  ), PRIORITY.LOW)
}
