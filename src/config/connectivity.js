// Connectivity, remote service and trade-compliance placeholders.
//
// As with the rest of the concept content, every value is a placeholder for
// layout purposes. Nothing here is configured, connected, or transmitting;
// the simulator has no network interfaces of any kind.

export const HL7_INTEGRATION = {
  standards: [
    { name: 'HL7 v2.x', usage: 'ORU^R01 observation results to the EMR', status: 'Placeholder' },
    { name: 'HL7 FHIR R4', usage: 'Observation / Device / DeviceMetric resources', status: 'Placeholder' },
    { name: 'IEEE 11073-10101', usage: 'Nomenclature for ventilator metrics', status: 'Placeholder' },
    { name: 'IHE PCD-01', usage: 'Device-to-enterprise communication profile', status: 'Placeholder' },
  ],
  mappedMetrics: [
    { metric: 'Ppeak', code: '‹MDC_PRESS_AWAY_INSP_PEAK›' },
    { metric: 'PEEP', code: '‹MDC_PRESS_AWAY_END_EXP_POS›' },
    { metric: 'Vte', code: '‹MDC_VOL_AWAY_TIDAL_EXP›' },
    { metric: 'MV', code: '‹MDC_VOL_MINUTE_AWAY_EXP›' },
    { metric: 'RR', code: '‹MDC_RESP_RATE›' },
    { metric: 'FiO₂', code: '‹MDC_CONC_AWAY_O2_INSP›' },
  ],
  destination: '‹Interface engine host / endpoint›',
}

export const CLOUD_SERVICES = {
  tenant: '‹Organisation / tenant id›',
  region: '‹Data residency region›',
  transport: 'TLS ‹version›, mutual authentication',
  identity: '‹Device certificate / key custody model›',
  dataMinimisation: '‹Fields transmitted, retention period, pseudonymisation approach›',
  privacyBasis: '‹GDPR lawful basis / HIPAA covered-entity relationship›',
  offlineBehaviour: 'Ventilation is independent of connectivity — therapy continues if the link drops',
}

export const REMOTE_MONITORING = {
  streams: [
    { name: 'Numeric snapshot', cadence: '‹interval›', purpose: 'Central station display' },
    { name: 'Alarm events', cadence: 'On change', purpose: 'Notification and escalation' },
    { name: 'Waveform segment', cadence: 'On request', purpose: 'Retrospective review' },
    { name: 'Device health', cadence: '‹interval›', purpose: 'Fleet service planning' },
  ],
  constraints: [
    'View-only by design — no remote change of ventilation settings',
    'Remote display is supplementary and is not a substitute for bedside alarms',
    'Latency and delivery are not guaranteed; the device remains the source of truth',
  ],
}

export const SOFTWARE_DISTRIBUTION = {
  channel: '‹Signed update channel›',
  signing: '‹Code-signing authority and key custody›',
  verification: 'Signature and integrity verified before installation',
  staging: '‹Ring / cohort rollout policy›',
  rollback: '‹Rollback and A/B partition strategy›',
  clinicalGate: 'Installation blocked while ventilating; requires operator confirmation in standby',
  recordKeeping: '‹Post-update verification and device history record update›',
  regulatory: '‹Change assessment — whether the update requires new clearance or notification›',
}

export const TRADE_COMPLIANCE = {
  items: [
    { label: 'Export classification', value: '‹ECCN / EAR99 determination›' },
    { label: 'Dual-use assessment', value: '‹EU dual-use regulation screening›' },
    { label: 'Restricted-party screening', value: '‹Denied/sanctioned party screening process›' },
    { label: 'Embargoed destinations', value: '‹Sanctioned territory controls›' },
    { label: 'Encryption reporting', value: '‹Encryption registration / notification status›' },
    { label: 'Country of origin', value: '‹Manufacturing origin for customs›' },
  ],
  note: 'Cryptography used for connectivity and update signing can attract export-control obligations independently of the device itself.',
}
