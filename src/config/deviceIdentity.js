// Placeholder device identity / regulatory metadata for the concept UI.
//
// Every value here is a deliberate placeholder for design layout purposes.
// Nothing in this file describes a real device, a real manufacturer, or a
// real registration. Angle-bracket text marks fields that a real programme
// would populate from its own controlled records.

export const DEVICE_NAMEPLATE = {
  modelName: '‹Model name›',
  modelNumber: 'REF ‹catalogue-no›',
  serialNumber: 'SN ‹serial-no›',
  manufacturer: '‹Legal manufacturer name›',
  manufacturerAddress: '‹Street›, ‹City›, ‹Country›',
  dateOfManufacture: '‹YYYY-MM›',
  ecRep: '‹EU authorised representative›',
  importer: '‹EU importer›',
  appliedPart: 'Type BF',
  ipRating: '‹IPxx›',
}

// UDI is split into a Device Identifier (static, identifies the model) and a
// Production Identifier (batch/serial/dates). Shown here in GS1 application
// identifier form purely to illustrate the layout of the HRI block.
export const UDI = {
  issuingAgency: '‹GS1 / HIBCC / ICCBBA›',
  deviceIdentifier: '‹(01) 00000000000000›',
  productionIdentifiers: [
    { ai: '(11)', label: 'Date of manufacture', value: '‹YYMMDD›' },
    { ai: '(17)', label: 'Expiry date', value: '‹YYMMDD›' },
    { ai: '(10)', label: 'Batch / lot', value: '‹lot›' },
    { ai: '(21)', label: 'Serial number', value: '‹serial›' },
  ],
  humanReadable: '(01)‹DI› (11)‹YYMMDD› (21)‹serial›',
  basicUdiDi: '‹Basic UDI-DI (MDR Annex VI)›',
  eudamed: '‹EUDAMED registration reference›',
  gmdn: '‹GMDN / EMDN code›',
}

// IEC 62304 software lifecycle metadata. Safety classification for a
// critical care ventilator's controlling software would normally be
// justified through the risk analysis rather than assumed.
export const SOFTWARE_RECORD = {
  applicationVersion: '0.2.0-concept',
  buildIdentifier: '‹CI build id›',
  releaseDate: '‹YYYY-MM-DD›',
  safetyClassification: '‹Class A / B / C — per IEC 62304 §4.3›',
  configurationRecord: '‹SCM baseline / tag›',
  integrityCheck: '‹release checksum›',
  soup: [
    { name: 'React', version: '19.x', purpose: 'User interface rendering' },
    { name: 'Vite', version: '8.x', purpose: 'Build tooling (not shipped at runtime)' },
  ],
  verification: [
    { id: '‹VER-001›', description: 'Lung model unit tests', status: 'Automated (vitest)' },
    { id: '‹VER-002›', description: 'Alarm condition unit tests', status: 'Automated (vitest)' },
    { id: '‹VER-003›', description: 'Usability / human factors evaluation', status: 'Placeholder' },
  ],
}

export const IFU_SECTIONS = [
  {
    id: 'intended-use',
    title: 'Intended use',
    body: '‹Statement of intended use, intended patient population, intended operator, intended environment, and clinical benefit.›',
  },
  {
    id: 'contraindications',
    title: 'Contraindications',
    body: '‹Conditions under which the device must not be used.›',
  },
  {
    id: 'warnings',
    title: 'Warnings and precautions',
    body: '‹Hazards, residual risks carried forward from the risk management file, and the precautions the operator must take.›',
  },
  {
    id: 'setup',
    title: 'Setup and pre-use check',
    body: '‹Circuit assembly, leak and compliance test, alarm verification, and the pre-use checklist to complete before connecting a patient.›',
  },
  {
    id: 'operation',
    title: 'Operation',
    body: '‹Mode descriptions, control ranges, and the meaning of each displayed measurement.›',
  },
  {
    id: 'alarms',
    title: 'Alarms',
    body: '‹Full alarm condition table with priorities, default limits, delays, and the operator response expected for each.›',
  },
  {
    id: 'cleaning',
    title: 'Cleaning and maintenance',
    body: '‹Reprocessing instructions, service intervals, and expected service life.›',
  },
  {
    id: 'disposal',
    title: 'Disposal',
    body: '‹End-of-life handling, including WEEE obligations where applicable.›',
  },
  {
    id: 'symbols',
    title: 'Symbol glossary',
    body: '‹Explanation of every symbol used on the device and its labelling, per ISO 15223-1.›',
  },
]
