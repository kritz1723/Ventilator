// Screen lock and setup lockout.
//
// Two distinct protections that are easy to conflate:
//
// The setup lockout is permanent while ventilating. Patient category, the
// simulated lung and its effort describe who is being ventilated, not how —
// changing them mid-therapy would redefine the patient underneath the
// operator, so they are unavailable until ventilation stops. This is not a
// convenience lock and has no override.
//
// The screen lock is a deliberate, operator-controlled guard against
// accidental contact, for transport or cleaning. It is unlocked by a
// deliberate action rather than a single tap, so a brush against the screen
// cannot clear it.
//
// Both leave the display fully readable. A lock that hid the patient's data
// would trade one hazard for a worse one, and alarm annunciation is never
// suppressed by either.

export const LOCK_STATE = {
  UNLOCKED: 'unlocked',
  LOCKED: 'locked',
  UNLOCKING: 'unlocking',
}

// Unlocking requires the control to be held, rather than tapped, so that
// incidental contact cannot release the lock.
export const UNLOCK_HOLD_MS = 1200

// Controls that describe the patient rather than the therapy. These are
// locked out for the whole of ventilation.
export const SETUP_CONTROLS = [
  'patientCategory',
  'patientPreset',
  'spontaneousEffort',
  'patientHeight',
  'patientSex',
  'featureConfiguration',
]

export function isSetupLocked(ventilating) {
  return Boolean(ventilating)
}

export function setupLockReason(control) {
  if (control === 'featureConfiguration') {
    return 'Feature configuration is unavailable while ventilating. Stop ventilation to make changes.'
  }
  return 'Patient setup is unavailable while ventilating. Stop ventilation to change it.'
}

// While the screen is locked, only actions that are themselves safety
// responses remain available: silencing an alarm, and unlocking.
const ALWAYS_PERMITTED = new Set(['unlock', 'pauseAudio'])

export function isActionPermitted(lockState, action) {
  if (lockState !== LOCK_STATE.LOCKED) return true
  return ALWAYS_PERMITTED.has(action)
}

export function unlockProgress(heldMs) {
  return Math.min(Math.max(heldMs / UNLOCK_HOLD_MS, 0), 1)
}

export function isUnlockComplete(heldMs) {
  return heldMs >= UNLOCK_HOLD_MS
}
