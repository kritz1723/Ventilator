// Event log.
//
// Records what happened and what was done, so a session can be
// reconstructed afterwards: alarms raising and clearing, every setting the
// operator changed with its old and new value, mode changes, maneuvers,
// device checks, captures, and ventilation state changes.
//
// Entries are immutable once written and the log is append-only, which is
// what makes it usable as a record rather than a status display.

export const EVENT_CATEGORY = {
  ALARM: 'alarm',
  SETTING: 'setting',
  MODE: 'mode',
  MANEUVER: 'maneuver',
  TEST: 'test',
  CAPTURE: 'capture',
  STATE: 'state',
}

export const CATEGORY_LABEL = {
  [EVENT_CATEGORY.ALARM]: 'Alarm',
  [EVENT_CATEGORY.SETTING]: 'Setting',
  [EVENT_CATEGORY.MODE]: 'Mode',
  [EVENT_CATEGORY.MANEUVER]: 'Maneuver',
  [EVENT_CATEGORY.TEST]: 'Test',
  [EVENT_CATEGORY.CAPTURE]: 'Capture',
  [EVENT_CATEGORY.STATE]: 'State',
}

// Categories that represent something the operator did, as opposed to
// something the device reported. The log filters on this distinction.
export const ACTION_CATEGORIES = [
  EVENT_CATEGORY.SETTING,
  EVENT_CATEGORY.MODE,
  EVENT_CATEGORY.MANEUVER,
  EVENT_CATEGORY.TEST,
  EVENT_CATEGORY.CAPTURE,
  EVENT_CATEGORY.STATE,
]

export const MAX_EVENTS = 500

let sequence = 0

export function createEvent({ category, severity = null, message, detail = null, at = null }) {
  sequence += 1
  return {
    seq: sequence,
    at: at ?? new Date().toISOString(),
    category,
    severity,
    message,
    detail,
  }
}

export function appendEvent(log, event) {
  return [event, ...log].slice(0, MAX_EVENTS)
}

// Compares two settings objects and produces one event per changed field,
// so the log records the specific change rather than "settings changed".
const SETTING_LABELS = {
  respRate: ['Rate', '/min'],
  tidalVolume: ['Tidal volume', 'mL'],
  pInsp: ['Inspiratory pressure', 'cmH₂O'],
  peep: ['PEEP', 'cmH₂O'],
  fio2: ['FiO₂', '%'],
  pauseTime: ['Inspiratory pause', 's'],
  triggerFlow: ['Trigger', 'L/min'],
  flowPattern: ['Flow pattern', ''],
}

const ALARM_LIMIT_LABELS = {
  highPressure: ['High pressure limit', 'cmH₂O'],
  lowPressure: ['Low pressure limit', 'cmH₂O'],
  highMinuteVolume: ['High MV limit', 'L/min'],
  lowMinuteVolume: ['Low MV limit', 'L/min'],
  lowTidalVolume: ['Low Vt limit', 'mL'],
  highRespRate: ['High rate limit', '/min'],
}

function describeChange(label, unit, from, to) {
  const suffix = unit ? ` ${unit}` : ''
  return `${label}: ${from}${suffix} → ${to}${suffix}`
}

export function diffSettings(previous, next) {
  const events = []
  if (!previous) return events

  if (previous.mode !== next.mode) {
    events.push(createEvent({
      category: EVENT_CATEGORY.MODE,
      message: `Mode changed to ${next.mode}`,
      detail: `from ${previous.mode}`,
    }))
  }

  for (const [key, [label, unit]] of Object.entries(SETTING_LABELS)) {
    if (previous[key] !== next[key]) {
      events.push(createEvent({
        category: EVENT_CATEGORY.SETTING,
        message: describeChange(label, unit, previous[key], next[key]),
      }))
    }
  }

  const prevLimits = previous.alarmLimits ?? {}
  const nextLimits = next.alarmLimits ?? {}
  for (const [key, [label, unit]] of Object.entries(ALARM_LIMIT_LABELS)) {
    if (prevLimits[key] !== nextLimits[key]) {
      events.push(createEvent({
        category: EVENT_CATEGORY.SETTING,
        message: describeChange(label, unit, prevLimits[key], nextLimits[key]),
      }))
    }
  }

  return events
}

// Alarms are logged on transition only — when a condition starts and when
// it clears — so a persisting alarm does not flood the log.
export function diffAlarms(previousActive, nextActive) {
  const events = []
  const prevIds = new Set(previousActive.map((a) => a.id))
  const nextIds = new Set(nextActive.map((a) => a.id))

  for (const alarm of nextActive) {
    if (!prevIds.has(alarm.id)) {
      events.push(createEvent({
        category: EVENT_CATEGORY.ALARM,
        severity: alarm.priority,
        message: `${alarm.label} — ${alarm.message}`,
        detail: alarm.detail,
      }))
    }
  }

  for (const alarm of previousActive) {
    if (!nextIds.has(alarm.id)) {
      events.push(createEvent({
        category: EVENT_CATEGORY.ALARM,
        severity: null,
        message: `${alarm.label} cleared`,
      }))
    }
  }

  return events
}

export function filterEvents(log, { categories = null, severities = null, query = '' } = {}) {
  const q = query.trim().toLowerCase()
  return log.filter((e) => {
    if (categories && categories.length && !categories.includes(e.category)) return false
    if (severities && severities.length && !severities.includes(e.severity)) return false
    if (q) {
      const haystack = `${e.message} ${e.detail ?? ''} ${CATEGORY_LABEL[e.category]}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function toCsv(events) {
  const header = 'seq,timestamp,category,severity,message,detail'
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = events.map((e) => [
    e.seq, e.at, e.category, e.severity ?? '', e.message, e.detail ?? '',
  ].map(escape).join(','))
  return [header, ...rows].join('\n')
}
