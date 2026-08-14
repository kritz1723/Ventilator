// Screen lock and setup lockout.
//
// Two distinct protections that are easy to conflate:
//
// The setup lockout is permanent while ventilating, but it covers less than
// it first appears to.
//
// Patient category and the demographics behind it bound the permitted range
// of every setting, so changing them mid-therapy would move the bounds
// underneath the operator. Those stay locked, with no override.
//
// The simulated lung and its spontaneous effort are deliberately NOT locked.
// On a real device the patient's mechanics are an input from the world, not a
// control. Here they are the subject being taught: watching pressure rise as
// compliance falls, or a patient begin to trigger, is the demonstration the
// simulator exists to give, and it has to be possible without stopping
// ventilation first. Treating them as patient identity was a category error.
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
  'patientHeight',
  'patientSex',
  'featureConfiguration',
]

// Simulation inputs: changeable at any time, including during ventilation,
// because changing them is the point of the simulator.
export const SIMULATION_CONTROLS = [
  'patientPreset',
  'spontaneousEffort',
]

export function isSetupLocked(ventilating) {
  return Boolean(ventilating)
}

export function setupLockReason(control) {
  if (control === 'featureConfiguration') {
    return 'Feature configuration is unavailable while ventilating. Stop ventilation to make changes.'
  }
  return 'Patient category bounds every setting range, so it cannot be changed while ventilating.'
}

export function isSimulationControl(control) {
  return SIMULATION_CONTROLS.includes(control)
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
