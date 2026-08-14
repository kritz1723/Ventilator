// User profile concepts.
//
// Usability engineering (IEC 62366-1) starts from who the intended users
// are, what they are trying to achieve, and the conditions they work in.
// These profiles drive both the interface decisions recorded in the design
// documents and the access rights modelled in the application.

export const USER_PROFILES = {
  'UP-01': {
    id: 'UP-01',
    role: 'Intensivist / prescribing clinician',
    training: 'Specialist medical training; may not be trained on this specific device',
    frequency: 'Several times per shift, often interrupted',
    environment: 'Bedside, noisy, competing alarms, time pressure',
    goals: [
      'Judge whether the current strategy is working',
      'Change targets in response to blood gases and mechanics',
      'Interpret waveforms and derived mechanics',
    ],
    accessRights: ['view-monitor', 'change-settings', 'run-maneuvers', 'change-alarm-limits'],
    usabilityRisks: [
      'May reason from numbers without checking which mode is active',
      'Interruption mid-task can leave a setting change unconfirmed',
    ],
  },
  'UP-02': {
    id: 'UP-02',
    role: 'ICU nurse',
    training: 'Device training as part of unit induction; highest contact time',
    frequency: 'Continuous presence, responds to most alarms first',
    environment: 'Bedside, frequently handling the patient and circuit',
    goals: [
      'Notice and act on alarms quickly',
      'Recognise disconnection, occlusion and desaturation',
      'Silence audio safely while resolving a cause',
    ],
    accessRights: ['view-monitor', 'change-alarm-limits', 'pause-audio', 'run-maneuvers'],
    usabilityRisks: [
      'Alarm fatigue leading to reflexive silencing',
      'Priority misread if colour alone distinguishes it',
    ],
  },
  'UP-03': {
    id: 'UP-03',
    role: 'Respiratory therapist',
    training: 'Deep device-specific training; performs setup and weaning',
    frequency: 'Scheduled rounds plus on call',
    environment: 'Bedside and equipment room',
    goals: [
      'Complete pre-use checks and circuit tests',
      'Set up the device for a new patient',
      'Drive weaning using mechanics and spontaneous indices',
    ],
    accessRights: ['view-monitor', 'change-settings', 'run-tests', 'run-maneuvers', 'change-alarm-limits'],
    usabilityRisks: ['May skip a check under time pressure if the flow permits it'],
  },
  'UP-04': {
    id: 'UP-04',
    role: 'Biomedical / clinical engineer',
    training: 'Technical training on the device platform',
    frequency: 'Planned maintenance and fault response',
    environment: 'Equipment room, device off patient',
    goals: [
      'Verify device identity, software version and configuration',
      'Configure enabled features and site defaults',
      'Investigate reported faults',
    ],
    accessRights: ['view-monitor', 'admin', 'configure-features', 'view-documents', 'run-tests'],
    usabilityRisks: ['Configuration change could alter clinical behaviour if applied while in use'],
  },
  'UP-05': {
    id: 'UP-05',
    role: 'Trainee / student',
    training: 'Learning; the primary audience for this simulator',
    frequency: 'Teaching sessions',
    environment: 'Classroom or skills lab',
    goals: ['Understand mode behaviour', 'See how mechanics change waveforms'],
    accessRights: ['view-monitor', 'change-settings', 'run-maneuvers', 'view-documents'],
    usabilityRisks: ['May mistake a simulator for a clinical tool if not clearly labelled'],
  },
}

export const ACCESS_RIGHTS = [
  'view-monitor', 'change-settings', 'change-alarm-limits', 'pause-audio',
  'run-maneuvers', 'run-tests', 'configure-features', 'view-documents', 'admin',
]
