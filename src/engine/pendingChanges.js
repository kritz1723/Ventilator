// Staging of setting changes made while ventilating.
//
// A change is edited into a pending copy and applied only when the operator
// accepts it, so the value reaching the patient is one that was reviewed.
//
// Deliberately not a confirmation prompt per keypress. Confirming every
// individual increment produces confirmation fatigue — operators learn to
// dismiss the prompt reflexively, which weakens it exactly where it matters.
// Staging keeps one review step per intent rather than one per keystroke.
//
// Transitions that change therapy wholesale (start, stop, mode, patient
// category) are separately confirmed, because those are not incremental
// edits and each carries its own hazard.

export const CONFIRMABLE = {
  START: 'start',
  STOP: 'stop',
  MODE: 'mode',
  CATEGORY: 'category',
  AUDIO_OFF: 'audioOff',
}

export const CONFIRMATION_COPY = {
  [CONFIRMABLE.START]: {
    title: 'Start ventilation?',
    body: 'The device will begin delivering breaths using the settings shown.',
    accept: 'Start ventilation',
  },
  [CONFIRMABLE.STOP]: {
    title: 'Stop ventilation?',
    body: 'Ventilation stops and the device returns to standby. Patient alarms are inhibited in standby.',
    accept: 'Stop ventilation',
  },
  [CONFIRMABLE.MODE]: {
    title: 'Change ventilation mode?',
    body: 'The breath delivery method changes immediately on the next breath.',
    accept: 'Change mode',
  },
  [CONFIRMABLE.CATEGORY]: {
    title: 'Change patient category?',
    body: 'Setting ranges change, and settings outside the new range are clamped into it.',
    accept: 'Change category',
  },
  // Disabling audio removes one of the two ways an alarm reaches the
  // operator, and unlike the pause it does not come back on its own. The
  // confirmation says what remains rather than only what is being lost.
  [CONFIRMABLE.AUDIO_OFF]: {
    title: 'Turn alarm audio off?',
    body: 'Alarms will annunciate visually only, with no sound, until audio is turned back on. This does not expire. An indicator stays on the status bar for as long as audio is off.',
    accept: 'Turn audio off',
  },
}

const TRACKED_KEYS = [
  'respRate', 'tidalVolume', 'pInsp', 'peep', 'fio2',
  'pauseTime', 'triggerFlow', 'flowPattern',
]

const LIMIT_KEYS = [
  'highPressure', 'lowPressure', 'highMinuteVolume',
  'lowMinuteVolume', 'lowTidalVolume', 'highRespRate',
]

// Fields that differ between the applied settings and the pending edit.
export function pendingDiff(applied, pending) {
  if (!pending) return []
  const changes = []

  for (const key of TRACKED_KEYS) {
    if (applied[key] !== pending[key]) {
      changes.push({ key, from: applied[key], to: pending[key], group: 'setting' })
    }
  }

  for (const key of LIMIT_KEYS) {
    const from = applied.alarmLimits?.[key]
    const to = pending.alarmLimits?.[key]
    if (from !== to) {
      changes.push({ key, from, to, group: 'alarmLimit' })
    }
  }

  return changes
}

export function hasPendingChanges(applied, pending) {
  return pendingDiff(applied, pending).length > 0
}

// Settings outside the range of a newly selected patient category are
// brought into range rather than left invalid.
export function clampToRanges(settings, ranges) {
  const next = { ...settings }
  for (const [key, range] of Object.entries(ranges)) {
    if (typeof next[key] === 'number') {
      next[key] = Math.min(Math.max(next[key], range.min), range.max)
    }
  }
  return next
}
