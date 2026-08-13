// Measurement snapshots.
//
// A snapshot records the monitored values at an instant, together with the
// settings and lung mechanics in force at the time, so a later comparison
// is between two fully described states rather than two bare numbers.

export const MAX_SNAPSHOTS = 20

let nextSequence = 1

export function createSnapshot({ numerics, measurements, settings, patient, note }) {
  return {
    id: `SNAP-${String(nextSequence++).padStart(3, '0')}`,
    takenAt: new Date().toISOString(),
    note: note ?? null,
    mode: settings.mode,
    settings: {
      respRate: settings.respRate,
      tidalVolume: settings.tidalVolume,
      pInsp: settings.pInsp,
      peep: settings.peep,
      fio2: settings.fio2,
    },
    patient: { label: patient.label, compliance: patient.compliance, resistance: patient.resistance },
    numerics: { ...numerics },
    measurements: { ...measurements },
  }
}

export function addSnapshot(list, snapshot) {
  return [snapshot, ...list].slice(0, MAX_SNAPSHOTS)
}

// Difference between a stored snapshot and the current state, per metric.
// `null` on either side yields a null delta rather than a misleading zero.
export function diffValue(reference, current) {
  if (reference == null || current == null || Number.isNaN(reference) || Number.isNaN(current)) {
    return null
  }
  return current - reference
}

export function formatClock(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '--:--:--' : d.toTimeString().slice(0, 8)
}
