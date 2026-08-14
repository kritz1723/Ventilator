// Feature licensing.
//
// Optional capability is enabled or disabled by configuration, so a site can
// restrict the interface to what it has purchased and trained for.
//
// The central rule is that licensing is a commercial boundary and never a
// safety one. A feature marked mandatory cannot be disabled by any
// configuration action, and the engine rejects the attempt rather than
// silently ignoring it — an alarm or a safety check must not be removable
// by a licence file. Every guard here is enforced in this module rather
// than in the interface, so hiding a control is not what makes a feature
// unavailable.

export const TIER = {
  BASE: 'base',
  ADVANCED: 'advanced',
  PREMIUM: 'premium',
}

export const TIER_LABEL = {
  [TIER.BASE]: 'Base',
  [TIER.ADVANCED]: 'Advanced',
  [TIER.PREMIUM]: 'Premium',
}

// mandatory: cannot be disabled under any circumstances.
// modes: mode identifiers this feature gates.
export const FEATURES = {
  coreModes: {
    id: 'coreModes',
    label: 'Core ventilation modes',
    description: 'Volume and pressure controlled ventilation.',
    tier: TIER.BASE,
    mandatory: true,
    modes: ['VC-CMV', 'PC-CMV'],
  },
  alarms: {
    id: 'alarms',
    label: 'Alarm system',
    description: 'Patient and technical alarm evaluation and annunciation.',
    tier: TIER.BASE,
    mandatory: true,
  },
  selfTests: {
    id: 'selfTests',
    label: 'Device self tests',
    description: 'Power-on self test and operator initiated checks.',
    tier: TIER.BASE,
    mandatory: true,
  },
  eventLog: {
    id: 'eventLog',
    label: 'Event record',
    description: 'Recording of alarms and operator actions.',
    tier: TIER.BASE,
    mandatory: true,
  },
  adaptiveModes: {
    id: 'adaptiveModes',
    label: 'Adaptive volume targeting',
    description: 'Pressure regulated volume control.',
    tier: TIER.ADVANCED,
    mandatory: false,
    modes: ['PRVC'],
  },
  spontaneousModes: {
    id: 'spontaneousModes',
    label: 'Spontaneous and support modes',
    description: 'Pressure support, CPAP and synchronised intermittent mandatory ventilation.',
    tier: TIER.ADVANCED,
    mandatory: false,
    modes: ['PSV', 'VC-SIMV'],
  },
  biLevelModes: {
    id: 'biLevelModes',
    label: 'Bi-level and release ventilation',
    description: 'Bi-level pressure ventilation and airway pressure release ventilation.',
    tier: TIER.PREMIUM,
    mandatory: false,
    modes: ['BILEVEL', 'APRV'],
  },
  maneuvers: {
    id: 'maneuvers',
    label: 'Hold maneuvers',
    description: 'Inspiratory and expiratory hold with derived mechanics.',
    tier: TIER.ADVANCED,
    mandatory: false,
  },
  loops: {
    id: 'loops',
    label: 'Pressure-volume and flow-volume loops',
    description: 'Loop display for the last complete breath.',
    tier: TIER.ADVANCED,
    mandatory: false,
  },
  captures: {
    id: 'captures',
    label: 'Capture and compare',
    description: 'Measurement snapshots with comparison against live values.',
    tier: TIER.ADVANCED,
    mandatory: false,
  },
  waveformLayout: {
    id: 'waveformLayout',
    label: 'Configurable waveform layout',
    description: 'Selectable traces, scales, order and sweep duration.',
    tier: TIER.PREMIUM,
    mandatory: false,
  },
  flowPatterns: {
    id: 'flowPatterns',
    label: 'Inspiratory flow patterns',
    description: 'Square, decelerating, accelerating and sine flow.',
    tier: TIER.ADVANCED,
    mandatory: false,
  },
}

export const DEFAULT_LICENCE = Object.fromEntries(
  Object.values(FEATURES).map((f) => [f.id, true]),
)

export class LicenceError extends Error {}

export function isEnabled(licence, featureId) {
  const feature = FEATURES[featureId]
  if (!feature) return false
  // A mandatory feature is enabled regardless of what the licence says, so a
  // malformed or tampered licence cannot switch off a safety function.
  if (feature.mandatory) return true
  return licence?.[featureId] === true
}

// Rejects rather than ignores, so an attempt to disable a safety feature is
// visible to the caller instead of silently having no effect.
export function setFeature(licence, featureId, enabled) {
  const feature = FEATURES[featureId]
  if (!feature) throw new LicenceError(`Unknown feature: ${featureId}`)
  if (feature.mandatory && !enabled) {
    throw new LicenceError(
      `${feature.label} is required for safe operation and cannot be disabled.`,
    )
  }
  return { ...licence, [featureId]: enabled }
}

export function applyTier(licence, tier) {
  const order = [TIER.BASE, TIER.ADVANCED, TIER.PREMIUM]
  const ceiling = order.indexOf(tier)
  const next = { ...licence }
  for (const f of Object.values(FEATURES)) {
    next[f.id] = f.mandatory || order.indexOf(f.tier) <= ceiling
  }
  return next
}

// The licence filters the mode registry itself rather than only the control
// that displays it, so a disabled mode is unreachable and not merely hidden.
export function licensedModes(licence, modes) {
  const gated = new Map()
  for (const f of Object.values(FEATURES)) {
    for (const m of f.modes ?? []) gated.set(m, f.id)
  }
  return Object.fromEntries(
    Object.entries(modes).filter(([id]) => {
      const featureId = gated.get(id)
      return featureId ? isEnabled(licence, featureId) : true
    }),
  )
}

// If the active mode loses its licence, fall back to a licensed one rather
// than leaving the device in a mode it is no longer permitted to deliver.
export function resolveActiveMode(licence, modes, activeId, fallbackId) {
  const available = licensedModes(licence, modes)
  if (available[activeId]) return activeId
  return available[fallbackId] ? fallbackId : Object.keys(available)[0]
}
