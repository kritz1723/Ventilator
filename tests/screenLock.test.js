import { describe, it, expect } from 'vitest'
import {
  LOCK_STATE, SETUP_CONTROLS, UNLOCK_HOLD_MS,
  isSetupLocked, setupLockReason, isActionPermitted,
  unlockProgress, isUnlockComplete,
} from '../src/engine/screenLock.js'

describe('setup lockout', () => {
  it('locks patient setup for the whole of ventilation', () => {
    expect(isSetupLocked(true)).toBe(true)
    expect(isSetupLocked(false)).toBe(false)
  })

  it('covers the controls that describe the patient rather than the therapy', () => {
    expect(SETUP_CONTROLS).toEqual(expect.arrayContaining([
      'patientCategory', 'patientPreset', 'spontaneousEffort', 'featureConfiguration',
    ]))
  })

  it('states a reason for every locked control', () => {
    for (const control of SETUP_CONTROLS) {
      expect(setupLockReason(control), control).toBeTruthy()
    }
  })

  it('gives feature configuration its own reason', () => {
    expect(setupLockReason('featureConfiguration')).not.toBe(setupLockReason('patientPreset'))
  })
})

describe('screen lock', () => {
  it('permits every action while unlocked', () => {
    for (const action of ['changeSetting', 'stopVentilation', 'unlock', 'pauseAudio']) {
      expect(isActionPermitted(LOCK_STATE.UNLOCKED, action), action).toBe(true)
    }
  })

  it('blocks ordinary controls while locked', () => {
    expect(isActionPermitted(LOCK_STATE.LOCKED, 'changeSetting')).toBe(false)
    expect(isActionPermitted(LOCK_STATE.LOCKED, 'stopVentilation')).toBe(false)
  })

  it('keeps safety responses available while locked', () => {
    // Silencing an alarm and unlocking must never be blocked by the lock.
    expect(isActionPermitted(LOCK_STATE.LOCKED, 'pauseAudio')).toBe(true)
    expect(isActionPermitted(LOCK_STATE.LOCKED, 'unlock')).toBe(true)
  })
})

describe('deliberate unlock', () => {
  it('does not unlock on a brief touch', () => {
    expect(isUnlockComplete(50)).toBe(false)
    expect(isUnlockComplete(UNLOCK_HOLD_MS - 1)).toBe(false)
  })

  it('unlocks once the hold is complete', () => {
    expect(isUnlockComplete(UNLOCK_HOLD_MS)).toBe(true)
  })

  it('reports progress bounded between zero and one', () => {
    expect(unlockProgress(0)).toBe(0)
    expect(unlockProgress(UNLOCK_HOLD_MS / 2)).toBeCloseTo(0.5, 6)
    expect(unlockProgress(UNLOCK_HOLD_MS * 3)).toBe(1)
    expect(unlockProgress(-100)).toBe(0)
  })
})
