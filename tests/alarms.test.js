import { describe, it, expect } from 'vitest'
import { evaluateAlarms, APNEA_TIMEOUT_SECONDS, PRIORITY } from '../src/engine/alarms.js'

const alarmLimits = {
  highPressure: 40,
  lowPressure: 5,
  highMinuteVolume: 12,
  lowMinuteVolume: 3,
  lowTidalVolume: 250,
  highRespRate: 35,
}

const nominal = {
  peakPressure: 20,
  minuteVolume: 6,
  tidalVolumeExhaled: 450,
  measuredRR: 14,
  alarmLimits,
  timeSinceLastBreath: 2,
  ventilating: true,
  technical: {},
}

describe('evaluateAlarms', () => {
  it('returns no alarms when everything is within limits', () => {
    expect(evaluateAlarms(nominal)).toHaveLength(0)
  })

  it('raises high airway pressure at high priority', () => {
    const alarms = evaluateAlarms({ ...nominal, peakPressure: 45 })
    const alarm = alarms.find((a) => a.id === 'high-pressure')
    expect(alarm).toBeDefined()
    expect(alarm.priority).toBe(PRIORITY.HIGH)
  })

  it('raises low airway pressure at high priority', () => {
    const alarms = evaluateAlarms({ ...nominal, peakPressure: 2 })
    expect(alarms.find((a) => a.id === 'low-pressure')?.priority).toBe(PRIORITY.HIGH)
  })

  it('raises apnea after the timeout', () => {
    const alarms = evaluateAlarms({ ...nominal, timeSinceLastBreath: APNEA_TIMEOUT_SECONDS + 1 })
    expect(alarms.find((a) => a.id === 'apnea')?.priority).toBe(PRIORITY.HIGH)
  })

  it('raises low minute volume at medium priority', () => {
    const alarms = evaluateAlarms({ ...nominal, minuteVolume: 1 })
    expect(alarms.find((a) => a.id === 'low-mv')?.priority).toBe(PRIORITY.MEDIUM)
  })

  it('raises low tidal volume at medium priority', () => {
    const alarms = evaluateAlarms({ ...nominal, tidalVolumeExhaled: 100 })
    expect(alarms.find((a) => a.id === 'low-vte')?.priority).toBe(PRIORITY.MEDIUM)
  })

  it('sorts the highest priority condition first', () => {
    const alarms = evaluateAlarms({ ...nominal, peakPressure: 45, minuteVolume: 1 })
    expect(alarms[0].priority).toBe(PRIORITY.HIGH)
  })

  it('inhibits patient alarms in standby but keeps technical ones', () => {
    const alarms = evaluateAlarms({
      ...nominal,
      peakPressure: 60,
      ventilating: false,
      technical: { preUseCheckDue: true },
    })
    expect(alarms.find((a) => a.id === 'high-pressure')).toBeUndefined()
    expect(alarms.find((a) => a.id === 'pre-use-check')?.priority).toBe(PRIORITY.LOW)
  })
})
