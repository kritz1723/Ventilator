export const DEFAULT_SETTINGS = {
  mode: 'VC',
  respRate: 14, // breaths/min
  ieRatio: [1, 2],
  tidalVolume: 450, // mL, used in VC
  pInsp: 15, // cmH2O above PEEP, used in PC
  peep: 5, // cmH2O
  pauseTime: 0.3, // s, end-inspiratory pause (VC)
  fio2: 40, // %, display only — not modeled
  alarmLimits: {
    highPressure: 40,
    lowPressure: 5,
  },
}
