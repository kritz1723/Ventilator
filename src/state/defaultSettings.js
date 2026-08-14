import { DEFAULT_MODE } from '../engine/ventilatorModes/index.js'
import { DEFAULT_FLOW_PATTERN } from '../engine/flowPatterns.js'

export const DEFAULT_SETTINGS = {
  mode: DEFAULT_MODE,
  flowPattern: DEFAULT_FLOW_PATTERN,
  respRate: 14, // breaths/min
  ieRatio: [1, 2],
  tidalVolume: 450, // mL — VC and PRVC
  pInsp: 15, // cmH2O above PEEP — PC
  peep: 5, // cmH2O
  pauseTime: 0.3, // s, end-inspiratory pause
  fio2: 40, // %, display only — gas mixing is not modelled
  pSupport: 10, // cmH2O above PEEP, used in PSV and for supported SIMV breaths
  cycleOffPercent: 25, // % of peak inspiratory flow at which a supported breath cycles
  effort: 'none', // spontaneous effort preset id
  riseTime: 0.2, // s, displayed as a concept control
  triggerFlow: 2, // L/min, displayed as a concept control
  alarmLimits: {
    highPressure: 40,
    lowPressure: 5,
    highMinuteVolume: 12,
    lowMinuteVolume: 3,
    lowTidalVolume: 250,
    highRespRate: 35,
  },
}

export const DEFAULT_PATIENT_DATA = {
  category: 'adult',
  sex: 'male',
  heightCm: 175,
  mlPerKg: 6,
}
