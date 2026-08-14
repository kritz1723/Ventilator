import * as volumeControl from './volumeControl.js'
import * as pressureControl from './pressureControl.js'
import * as prvc from './prvc.js'
import * as pressureSupport from './pressureSupport.js'
import * as biLevel from './biLevel.js'
import * as simv from './simv.js'

// Registry of available modes. Adding a mode means adding an entry here and
// a module exposing `step` and `initialState` — nothing else changes.
//
// Deliberately excluded: proportional assist, neurally adjusted ventilatory
// assist, and closed-loop automation such as adaptive support ventilation.
// Those are vendor-proprietary algorithms; reproducing their control logic
// would be neither verifiable nor appropriate here.

export const MODES = {
  'VC-CMV': {
    id: 'VC-CMV',
    label: 'VC-CMV',
    name: 'Volume control',
    impl: volumeControl,
    primaryControl: 'tidalVolume',
    supportsFlowPattern: true,
    spontaneous: false,
  },
  'PC-CMV': {
    id: 'PC-CMV',
    label: 'PC-CMV',
    name: 'Pressure control',
    impl: pressureControl,
    primaryControl: 'pInsp',
    supportsFlowPattern: false,
    spontaneous: false,
  },
  PRVC: {
    id: 'PRVC',
    label: 'PRVC',
    name: 'Pressure regulated volume control',
    impl: prvc,
    primaryControl: 'tidalVolume',
    supportsFlowPattern: false,
    spontaneous: false,
  },
  'VC-SIMV': {
    id: 'VC-SIMV',
    label: 'VC-SIMV',
    name: 'Synchronised intermittent mandatory ventilation',
    impl: simv,
    primaryControl: 'tidalVolume',
    supportsFlowPattern: true,
    spontaneous: true,
    supportsPressureSupport: true,
  },
  PSV: {
    id: 'PSV',
    label: 'PSV / CPAP',
    name: 'Pressure support; CPAP at zero support',
    impl: pressureSupport,
    primaryControl: 'pSupport',
    supportsFlowPattern: false,
    spontaneous: true,
    supportsPressureSupport: true,
    supportsCycleOff: true,
  },
  BILEVEL: {
    id: 'BILEVEL',
    label: 'BiLevel',
    name: 'Bi-level pressure with spontaneous breathing',
    impl: biLevel,
    primaryControl: 'pInsp',
    supportsFlowPattern: false,
    spontaneous: true,
  },
  APRV: {
    id: 'APRV',
    label: 'APRV',
    name: 'Airway pressure release ventilation',
    impl: biLevel,
    primaryControl: 'pInsp',
    supportsFlowPattern: false,
    spontaneous: true,
    // APRV is bi-level held long at the high pressure with a brief release.
    presetSettings: { ieRatio: [9, 1], respRate: 12 },
  },
}

export const DEFAULT_MODE = 'VC-CMV'

export function modeImpl(modeId) {
  return (MODES[modeId] ?? MODES[DEFAULT_MODE]).impl
}
