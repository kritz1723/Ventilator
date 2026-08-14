// Alarm audio: what should sound, when, and whether it is allowed to.
//
// This module holds the decisions. The oscillators live in alarmAudio.js, so
// the rules that matter for safety can be tested without a sound card.
//
// The tone patterns follow the *shape* IEC 60601-1-8 describes — a burst of
// pulses whose count and repetition rate carry the priority, so that priority
// is audible without reading the screen. They are a recognisable imitation,
// not a certified implementation of the standard's melodies, and nothing here
// has been verified against the standard's acoustic requirements. This is a
// simulator; the sound teaches the pattern, it does not qualify a device.
//
// Three states, and the difference between the last two is the whole point:
//
//   SOUNDING  an alarm is annunciated audibly
//   PAUSED    audio is suspended briefly and returns by itself
//   OFF       audio is disabled until someone turns it back on
//
// A pause that lasted indefinitely would be an off switch nobody remembered
// pressing. An off that expired by itself would be a device overriding a
// decision the operator made. They are separate mechanisms with separate
// indications, and off is never reached by accident.

import { PRIORITY, PRIORITY_RANK } from './alarms.js'

export const AUDIO_STATE = {
  SOUNDING: 'sounding',
  PAUSED: 'paused',
  OFF: 'off',
  SILENT: 'silent',
}

// Pulse timings in milliseconds from the start of a burst, with the burst
// repeating at its own interval. The high-priority burst is five pulses in
// two groups; medium is three; low is a single pulse repeated rarely. Count
// and rate together are what make a priority recognisable across a room.
export const TONE_PATTERNS = {
  [PRIORITY.HIGH]: {
    priority: PRIORITY.HIGH,
    label: 'High priority',
    baseHz: 494,
    steps: [0, 2, 4, 2, 0],
    offsetsMs: [0, 150, 300, 700, 850],
    pulseMs: 120,
    intervalMs: 2600,
    gain: 0.34,
  },
  [PRIORITY.MEDIUM]: {
    priority: PRIORITY.MEDIUM,
    label: 'Medium priority',
    baseHz: 440,
    steps: [0, 2, 4],
    offsetsMs: [0, 190, 380],
    pulseMs: 150,
    intervalMs: 7000,
    gain: 0.26,
  },
  [PRIORITY.LOW]: {
    priority: PRIORITY.LOW,
    label: 'Low priority',
    baseHz: 392,
    steps: [0, 2],
    offsetsMs: [0, 210],
    pulseMs: 170,
    intervalMs: 20000,
    gain: 0.18,
  },
}

// Equal temperament, so the intervals within a burst are musical rather than
// arbitrary — a burst of unrelated frequencies reads as a fault, not a signal.
export function stepToHz(baseHz, step) {
  return baseHz * (2 ** (step / 12))
}

export function patternFor(priority) {
  return TONE_PATTERNS[priority] ?? null
}

// The pulses of one burst, resolved to frequency and time. Returned rather
// than played, so the schedule can be asserted.
export function burstPulses(priority) {
  const pattern = patternFor(priority)
  if (!pattern) return []
  return pattern.offsetsMs.map((atMs, i) => ({
    atMs,
    durationMs: pattern.pulseMs,
    frequency: stepToHz(pattern.baseHz, pattern.steps[i] ?? 0),
    gain: pattern.gain,
  }))
}

export function burstDurationMs(priority) {
  const pulses = burstPulses(priority)
  if (!pulses.length) return 0
  const last = pulses[pulses.length - 1]
  return last.atMs + last.durationMs
}

// The alarm that should be heard: the highest priority present. Annunciating
// several at once produces noise from which no priority can be read.
export function leadingAlarm(alarms) {
  if (!alarms?.length) return null
  return alarms.reduce((worst, a) => (
    PRIORITY_RANK[a.priority] > PRIORITY_RANK[worst.priority] ? a : worst
  ), alarms[0])
}

export function audioStateFor({ enabled, pausedUntil = 0, alarms = [], now = Date.now() }) {
  if (!enabled) return AUDIO_STATE.OFF
  if (!alarms.length) return AUDIO_STATE.SILENT
  if (pausedUntil > now) return AUDIO_STATE.PAUSED
  return AUDIO_STATE.SOUNDING
}

export function shouldSound(args) {
  return audioStateFor(args) === AUDIO_STATE.SOUNDING
}

export function pauseRemainingSeconds(pausedUntil, now = Date.now()) {
  return Math.max(0, Math.ceil((pausedUntil - now) / 1000))
}

// A pause silences what is alarming at the moment it is pressed. An alarm of
// higher priority arriving afterwards is new information, and the operator's
// decision to silence the old one was not a decision about this one — so the
// pause ends and the new condition is heard.
//
// Deliberate audio-off is not affected. That was a decision about the
// device, not about a particular alarm, and reversing it silently would take
// the control away from the person who set it.
export function pauseSurvives(previousAlarms, nextAlarms) {
  const before = leadingAlarm(previousAlarms)
  const after = leadingAlarm(nextAlarms)
  if (!after) return true
  if (!before) return false
  return PRIORITY_RANK[after.priority] <= PRIORITY_RANK[before.priority]
}

// Turning audio off is confirmed; turning it back on never is. Guarding the
// safe direction only teaches the operator to dismiss the guard.
export function requiresConfirmation(nextEnabled) {
  return nextEnabled === false
}
