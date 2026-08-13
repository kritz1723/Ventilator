// Illustrative renderings of the kinds of symbols that appear on medical
// device labelling (ISO 15223-1, IEC 60417, ISO 7000 families).
//
// These are simplified in-house drawings for layout purposes only. Real
// labelling must use the exact artwork and proportions from the applicable
// standard, with a symbol glossary in the IFU.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Frame({ children, boxed = true }) {
  return (
    <svg viewBox="0 0 32 24" className="iso-symbol" role="presentation" focusable="false">
      {boxed && <rect x="0.8" y="0.8" width="30.4" height="22.4" rx="2" {...base} />}
      {children}
    </svg>
  )
}

export function SymbolConsultIFU() {
  return (
    <Frame>
      <path d="M8 7.5h7v10H8z" {...base} />
      <path d="M15 7.5h7v10h-7z" {...base} />
      <path d="M18.5 11.5v3.5M18.5 9.8v.1" {...base} />
    </Frame>
  )
}

export function SymbolManufacturer() {
  return (
    <Frame>
      <path d="M7 17V9l5 3V9l5 3V9l5 3v5z" {...base} />
    </Frame>
  )
}

export function SymbolDateOfManufacture() {
  return (
    <Frame>
      <path d="M8 8h16v9H8z" {...base} />
      <path d="M8 11.5h16M12 8V6.5M20 8V6.5" {...base} />
    </Frame>
  )
}

export function SymbolSerialNumber() {
  return (
    <Frame>
      <text x="16" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none">SN</text>
    </Frame>
  )
}

export function SymbolCatalogue() {
  return (
    <Frame>
      <text x="16" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">REF</text>
    </Frame>
  )
}

export function SymbolBatch() {
  return (
    <Frame>
      <text x="16" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">LOT</text>
    </Frame>
  )
}

export function SymbolMedicalDevice() {
  return (
    <Frame>
      <text x="16" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none">MD</text>
    </Frame>
  )
}

export function SymbolUDI() {
  return (
    <Frame>
      <text x="16" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">UDI</text>
    </Frame>
  )
}

export function SymbolCaution() {
  return (
    <Frame boxed={false}>
      <path d="M16 4.5 29 20H3z" {...base} />
      <path d="M16 10.5v4.2M16 17.4v.1" {...base} />
    </Frame>
  )
}

export function SymbolTypeBF() {
  return (
    <Frame>
      <circle cx="16" cy="12" r="7" {...base} />
      <path d="M12.4 15.2c0-2.6 1.2-3.4 1.2-4.6a1.6 1.6 0 0 0-3.1 0" {...base} transform="translate(2.6 -0.6)" />
      <path d="M16.6 15.2c0-2.6 1.2-3.4 1.2-4.6a1.6 1.6 0 0 0-3.1 0" {...base} transform="translate(2.6 -0.6)" />
    </Frame>
  )
}

export function SymbolWEEE() {
  return (
    <Frame boxed={false}>
      <path d="M11 8h10l-1 12h-8z" {...base} />
      <path d="M13 8V6h6v2M9.5 8h13" {...base} />
      <path d="M8 21 24 4" {...base} />
    </Frame>
  )
}

export function SymbolRxOnly() {
  return (
    <Frame>
      <text x="16" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">Rx</text>
    </Frame>
  )
}

export function SymbolCE() {
  return (
    <Frame boxed={false}>
      <path d="M15 6.5a6 6 0 1 0 0 11" {...base} strokeWidth="2" />
      <path d="M27 6.5a6 6 0 1 0 0 11M22.5 12h4.5" {...base} strokeWidth="2" />
    </Frame>
  )
}

export const SYMBOL_GLOSSARY = [
  { Icon: SymbolConsultIFU, code: 'ISO 15223-1, 5.4.3', meaning: 'Consult instructions for use' },
  { Icon: SymbolManufacturer, code: 'ISO 15223-1, 5.1.1', meaning: 'Legal manufacturer' },
  { Icon: SymbolDateOfManufacture, code: 'ISO 15223-1, 5.1.3', meaning: 'Date of manufacture' },
  { Icon: SymbolSerialNumber, code: 'ISO 15223-1, 5.1.7', meaning: 'Serial number' },
  { Icon: SymbolCatalogue, code: 'ISO 15223-1, 5.1.6', meaning: 'Catalogue number' },
  { Icon: SymbolBatch, code: 'ISO 15223-1, 5.1.5', meaning: 'Batch / lot code' },
  { Icon: SymbolMedicalDevice, code: 'ISO 15223-1, 5.7.7', meaning: 'Medical device' },
  { Icon: SymbolUDI, code: 'ISO 15223-1, 5.7.10', meaning: 'Unique device identifier' },
  { Icon: SymbolCaution, code: 'ISO 15223-1, 5.4.4', meaning: 'Caution — consult accompanying documents' },
  { Icon: SymbolTypeBF, code: 'IEC 60417-5333', meaning: 'Type BF applied part' },
  { Icon: SymbolWEEE, code: 'Directive 2012/19/EU', meaning: 'Separate collection for electrical equipment' },
  { Icon: SymbolRxOnly, code: '21 CFR 801.109', meaning: 'Prescription device (US)' },
  { Icon: SymbolCE, code: 'Regulation (EU) 2017/745', meaning: 'CE marking of conformity' },
]
