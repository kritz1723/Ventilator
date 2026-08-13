// Device check-out routines: a power-on self test, an operator-run partial
// test, and a patient-circuit leak/compliance test.
//
// The step lists are illustrative of the kinds of checks a critical care
// ventilator performs before use. In this simulator each step simply
// resolves after a short delay with a simulated result — no hardware is
// exercised and no measurement is real.

export const TEST_SUITES = {
  powerOn: {
    id: 'powerOn',
    name: 'Power-on self test',
    description: 'Runs automatically at start-up before the device can be used.',
    blocking: true,
    steps: [
      { id: 'cpu', label: 'Processor and memory integrity' },
      { id: 'software', label: 'Software configuration and checksum' },
      { id: 'watchdog', label: 'Watchdog and safety monitor' },
      { id: 'sensors', label: 'Pressure and flow sensor response' },
      { id: 'valves', label: 'Inspiratory and expiratory valve travel' },
      { id: 'alarm-audio', label: 'Alarm annunciator and indicator lamps' },
      { id: 'battery', label: 'Backup battery capacity' },
      { id: 'gas-supply', label: 'Gas supply pressures' },
    ],
  },
  partial: {
    id: 'partial',
    name: 'Partial test',
    description: 'Shorter operator-initiated subset for use between patients.',
    blocking: false,
    steps: [
      { id: 'sensors', label: 'Sensor zero and span' },
      { id: 'alarm-audio', label: 'Alarm annunciator' },
      { id: 'valves', label: 'Valve travel' },
    ],
  },
  leak: {
    id: 'leak',
    name: 'Leak and compliance test',
    description: 'Occlude the patient connection port when prompted.',
    blocking: false,
    steps: [
      { id: 'occlude', label: 'Occlude patient connection port' },
      { id: 'pressurise', label: 'Pressurise circuit to test pressure' },
      { id: 'leak-rate', label: 'Measure leak rate' },
      { id: 'compliance', label: 'Measure circuit compliance' },
      { id: 'resistance', label: 'Measure circuit resistance' },
    ],
  },
}

// Simulated measurement results reported at the end of the leak test.
export const LEAK_TEST_RESULTS = [
  { label: 'Circuit leak', value: '‹x.x›', unit: 'L/min', limit: 'Limit ‹x.x› L/min' },
  { label: 'Circuit compliance', value: '‹x.x›', unit: 'mL/cmH₂O', limit: 'Limit ‹x.x› mL/cmH₂O' },
  { label: 'Circuit resistance', value: '‹x.x›', unit: 'cmH₂O/L/s', limit: 'Limit ‹x.x› cmH₂O/L/s' },
]

export const STEP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PASSED: 'passed',
  FAILED: 'failed',
}

export function initialStepStates(suite) {
  return suite.steps.map((step) => ({ ...step, status: STEP_STATUS.PENDING }))
}
