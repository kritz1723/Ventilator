// Alarm evaluation for the simulator. Checks are recomputed every tick from
// the current numerics and settings; alarm limits are user-adjustable, not
// hardcoded clinical defaults.

export const APNEA_TIMEOUT_SECONDS = 20

export function evaluateAlarms({ peakPressure, alarmLimits, timeSinceLastBreath }) {
  const active = []

  if (peakPressure >= alarmLimits.highPressure) {
    active.push({
      id: 'high-pressure',
      severity: 'high',
      message: `High airway pressure: ${peakPressure.toFixed(0)} cmH2O (limit ${alarmLimits.highPressure})`,
    })
  }

  if (alarmLimits.lowPressure != null && peakPressure < alarmLimits.lowPressure) {
    active.push({
      id: 'low-pressure',
      severity: 'medium',
      message: `Low airway pressure: ${peakPressure.toFixed(0)} cmH2O (limit ${alarmLimits.lowPressure})`,
    })
  }

  if (timeSinceLastBreath >= APNEA_TIMEOUT_SECONDS) {
    active.push({
      id: 'apnea',
      severity: 'high',
      message: `Apnea: no breath detected for ${timeSinceLastBreath.toFixed(0)}s`,
    })
  }

  return active
}
