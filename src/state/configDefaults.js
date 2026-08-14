import { DEFAULT_SETTINGS, DEFAULT_PATIENT_DATA } from './defaultSettings.js'
import { DEFAULT_PATIENT_PRESET } from '../engine/patientPresets.js'
import { DEFAULT_THEME } from '../config/themes.js'
import { DEFAULT_SELECTED_MEASUREMENTS } from '../config/measurementCatalog.js'
import { DEFAULT_LAYOUT } from '../config/traceCatalog.js'
import { DEFAULT_LICENCE } from '../config/licensing.js'
import { DEFAULT_UNITS } from '../config/units.js'
import { DEFAULT_LANGUAGE } from '../config/i18n.js'
import { DEFAULT_WORKSPACE, DEFAULT_DISPLAY_SCALE } from '../config/workspace.js'

// The configuration that survives a reload, with the value each field falls
// back to when nothing has been stored.
//
// This object is the single definition of what configuration is. The list of
// persisted fields is derived from its keys rather than written out
// separately, because a separate list is a list that drifts: a field added
// here and forgotten there is silently not saved, and the symptom — a
// setting that quietly fails to survive a reload — points at storage rather
// than at the omission that caused it.
//
// Running state is deliberately absent. Screen, alarms, the waveform and the
// flush timer are all rebuilt from scratch, so a reload always lands in
// standby with nothing being delivered.
export const CONFIG_DEFAULTS = {
  settings: DEFAULT_SETTINGS,
  patientData: DEFAULT_PATIENT_DATA,
  patientKey: DEFAULT_PATIENT_PRESET,
  theme: DEFAULT_THEME,
  selectedMeasurements: DEFAULT_SELECTED_MEASUREMENTS,
  layout: DEFAULT_LAYOUT,
  licence: DEFAULT_LICENCE,
  units: DEFAULT_UNITS,
  language: DEFAULT_LANGUAGE,
  workspace: DEFAULT_WORKSPACE,
  displayScale: DEFAULT_DISPLAY_SCALE,
}

export const CONFIG_FIELDS = Object.keys(CONFIG_DEFAULTS)
