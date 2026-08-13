import { describe, it, expect } from 'vitest'
import { evaluateAlarms, APNEA_TIMEOUT_SECONDS } from '../src/engine/alarms.js'

describe('evaluateAlarms', () => {
  const alarmLimits = { highPressure: 40, lowPressure: 5 }

  it('returns no alarms when within limits and breathing regularly', () => {
    const alarms = evaluateAlarms({ peakPressure: 20, alarmLimits, timeSinceLastBreath: 2 })
    expect(alarms).toHaveLength(0)
  })

  it('flags high pressure', () => {
    const alarms = evaluateAlarms({ peakPressure: 45, alarmLimits, timeSinceLastBreath: 2 })
    expect(alarms.some((a) => a.id === 'high-pressure')).toBe(true)
  })

  it('flags low pressure', () => {
    const alarms = evaluateAlarms({ peakPressure: 2, alarmLimits, timeSinceLastBreath: 2 })
    expect(alarms.some((a) => a.id === 'low-pressure')).toBe(true)
  })

  it('flags apnea after the timeout', () => {
    const alarms = evaluateAlarms({ peakPressure: 20, alarmLimits, timeSinceLastBreath: APNEA_TIMEOUT_SECONDS + 1 })
    expect(alarms.some((a) => a.id === 'apnea')).toBe(true)
  })
})
