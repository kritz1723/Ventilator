import * as volumeControl from './volumeControl.js'
import * as pressureControl from './pressureControl.js'
import * as prvc from './prvc.js'

// Registry of available modes. Adding a mode means adding an entry here and
// a module exposing `step` and `initialState` — nothing else changes.
export const MODES = {
  'VC-CMV': {
    id: 'VC-CMV',
    label: 'VC-CMV',
    name: 'Volume control',
    impl: volumeControl,
    primaryControl: 'tidalVolume',
    supportsFlowPattern: true,
  },
  'PC-CMV': {
    id: 'PC-CMV',
    label: 'PC-CMV',
    name: 'Pressure control',
    impl: pressureControl,
    primaryControl: 'pInsp',
    supportsFlowPattern: false,
  },
  PRVC: {
    id: 'PRVC',
    label: 'PRVC',
    name: 'Pressure regulated volume control',
    impl: prvc,
    primaryControl: 'tidalVolume',
    supportsFlowPattern: false,
  },
}

export const DEFAULT_MODE = 'VC-CMV'

export function modeImpl(modeId) {
  return (MODES[modeId] ?? MODES[DEFAULT_MODE]).impl
}
