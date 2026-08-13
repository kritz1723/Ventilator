import { useState } from 'react'
import {
  DEVICE_NAMEPLATE,
  UDI,
  SOFTWARE_RECORD,
  IFU_SECTIONS,
} from '../config/deviceIdentity.js'
import {
  HL7_INTEGRATION,
  CLOUD_SERVICES,
  REMOTE_MONITORING,
  SOFTWARE_DISTRIBUTION,
  TRADE_COMPLIANCE,
} from '../config/connectivity.js'
import {
  SYMBOL_GLOSSARY,
  SymbolManufacturer,
  SymbolDateOfManufacture,
  SymbolSerialNumber,
  SymbolCatalogue,
  SymbolUDI,
  SymbolConsultIFU,
  SymbolMedicalDevice,
  SymbolTypeBF,
  SymbolCE,
  SymbolRxOnly,
} from './Symbols.jsx'

const TABS = [
  { id: 'device', label: 'Device' },
  { id: 'udi', label: 'UDI' },
  { id: 'software', label: 'Software' },
  { id: 'ifu', label: 'IFU' },
  { id: 'connectivity', label: 'Connectivity' },
  { id: 'service', label: 'Service' },
  { id: 'trade', label: 'Trade' },
  { id: 'symbols', label: 'Symbols' },
]

function Row({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}

// A stand-in for the 2D data carrier that would encode the UDI. This is a
// decorative pattern, not an encoding of anything.
function DataMatrixPlaceholder() {
  const cells = []
  for (let r = 0; r < 12; r += 1) {
    for (let c = 0; c < 12; c += 1) {
      const edge = c === 0 || r === 11
      const timing = (r === 0 && c % 2 === 0) || (c === 11 && r % 2 === 0)
      const body = !edge && !timing && (r * 7 + c * 5 + ((r * c) % 3)) % 3 === 0
      if (edge || timing || body) {
        cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />)
      }
    }
  }
  return (
    <svg viewBox="0 0 12 12" className="datamatrix" role="img" aria-label="UDI data carrier placeholder">
      {cells}
    </svg>
  )
}

export default function DeviceInfoDrawer({ open, onClose }) {
  const [tab, setTab] = useState('device')
  if (!open) return null

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Device information"
      >
        <header className="drawer-head">
          <div>
            <h2>Device information</h2>
            <p>Placeholder regulatory content for design review</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </header>

        <nav className="drawer-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'drawer-tab active' : 'drawer-tab'}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </nav>

        <div className="drawer-body">
          {tab === 'device' && (
            <>
              <div className="nameplate">
                <div className="nameplate-symbols">
                  <SymbolMedicalDevice />
                  <SymbolCE />
                  <SymbolTypeBF />
                  <SymbolRxOnly />
                  <SymbolConsultIFU />
                </div>
                <Row label={<><SymbolCatalogue /> Model</>} value={`${DEVICE_NAMEPLATE.modelName} · ${DEVICE_NAMEPLATE.modelNumber}`} />
                <Row label={<><SymbolSerialNumber /> Serial</>} value={DEVICE_NAMEPLATE.serialNumber} />
                <Row label={<><SymbolManufacturer /> Manufacturer</>} value={DEVICE_NAMEPLATE.manufacturer} />
                <Row label="Address" value={DEVICE_NAMEPLATE.manufacturerAddress} />
                <Row label={<><SymbolDateOfManufacture /> Manufactured</>} value={DEVICE_NAMEPLATE.dateOfManufacture} />
                <Row label="EU representative" value={DEVICE_NAMEPLATE.ecRep} />
                <Row label="Importer" value={DEVICE_NAMEPLATE.importer} />
                <Row label="Applied part" value={DEVICE_NAMEPLATE.appliedPart} />
                <Row label="Ingress protection" value={DEVICE_NAMEPLATE.ipRating} />
              </div>
              <p className="drawer-note">
                Nameplate fields are placeholders. A real device populates these from
                controlled records and reproduces the symbols to the artwork defined
                in ISO 15223-1.
              </p>
            </>
          )}

          {tab === 'udi' && (
            <>
              <div className="udi-carrier">
                <DataMatrixPlaceholder />
                <div className="udi-hri">
                  <span className="udi-hri-label"><SymbolUDI /> Human-readable interpretation</span>
                  <code>{UDI.humanReadable}</code>
                </div>
              </div>
              <Row label="Issuing agency" value={UDI.issuingAgency} />
              <Row label="Device identifier (DI)" value={UDI.deviceIdentifier} />
              <Row label="Basic UDI-DI" value={UDI.basicUdiDi} />
              <Row label="EUDAMED" value={UDI.eudamed} />
              <Row label="Nomenclature" value={UDI.gmdn} />
              <div className="subsection-title">Production identifiers</div>
              {UDI.productionIdentifiers.map((pi) => (
                <Row key={pi.ai} label={`${pi.ai} ${pi.label}`} value={pi.value} />
              ))}
            </>
          )}

          {tab === 'software' && (
            <>
              <Row label="Application version" value={SOFTWARE_RECORD.applicationVersion} />
              <Row label="Build identifier" value={SOFTWARE_RECORD.buildIdentifier} />
              <Row label="Release date" value={SOFTWARE_RECORD.releaseDate} />
              <Row label="Safety classification" value={SOFTWARE_RECORD.safetyClassification} />
              <Row label="Configuration baseline" value={SOFTWARE_RECORD.configurationRecord} />
              <Row label="Integrity check" value={SOFTWARE_RECORD.integrityCheck} />

              <div className="subsection-title">SOUP inventory</div>
              <table className="info-table">
                <thead><tr><th>Item</th><th>Version</th><th>Purpose</th></tr></thead>
                <tbody>
                  {SOFTWARE_RECORD.soup.map((s) => (
                    <tr key={s.name}><td>{s.name}</td><td>{s.version}</td><td>{s.purpose}</td></tr>
                  ))}
                </tbody>
              </table>

              <div className="subsection-title">Verification records</div>
              <table className="info-table">
                <thead><tr><th>ID</th><th>Description</th><th>Status</th></tr></thead>
                <tbody>
                  {SOFTWARE_RECORD.verification.map((v) => (
                    <tr key={v.id}><td>{v.id}</td><td>{v.description}</td><td>{v.status}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="drawer-note">
                IEC 62304 expects the software safety classification to follow from the
                risk analysis, with a maintained SOUP inventory and traceable
                verification records. These entries are placeholders.
              </p>
            </>
          )}

          {tab === 'ifu' && (
            <>
              <div className="ifu-head">
                <SymbolConsultIFU />
                <span>Instructions for use — placeholder outline</span>
              </div>
              {IFU_SECTIONS.map((s) => (
                <details key={s.id} className="ifu-section">
                  <summary>{s.title}</summary>
                  <p>{s.body}</p>
                </details>
              ))}
            </>
          )}

          {tab === 'connectivity' && (
            <>
              <div className="subsection-title">Interoperability standards</div>
              <table className="info-table">
                <thead><tr><th>Standard</th><th>Usage</th><th>Status</th></tr></thead>
                <tbody>
                  {HL7_INTEGRATION.standards.map((s2) => (
                    <tr key={s2.name}><td>{s2.name}</td><td>{s2.usage}</td><td>{s2.status}</td></tr>
                  ))}
                </tbody>
              </table>

              <div className="subsection-title">Metric mapping</div>
              <table className="info-table">
                <thead><tr><th>Metric</th><th>Nomenclature code</th></tr></thead>
                <tbody>
                  {HL7_INTEGRATION.mappedMetrics.map((m) => (
                    <tr key={m.metric}><td>{m.metric}</td><td>{m.code}</td></tr>
                  ))}
                </tbody>
              </table>
              <Row label="Destination" value={HL7_INTEGRATION.destination} />

              <div className="subsection-title">Cloud services</div>
              <Row label="Tenant" value={CLOUD_SERVICES.tenant} />
              <Row label="Data residency" value={CLOUD_SERVICES.region} />
              <Row label="Transport" value={CLOUD_SERVICES.transport} />
              <Row label="Device identity" value={CLOUD_SERVICES.identity} />
              <Row label="Data minimisation" value={CLOUD_SERVICES.dataMinimisation} />
              <Row label="Privacy basis" value={CLOUD_SERVICES.privacyBasis} />
              <Row label="If the link drops" value={CLOUD_SERVICES.offlineBehaviour} />

              <div className="subsection-title">Remote monitoring</div>
              <table className="info-table">
                <thead><tr><th>Stream</th><th>Cadence</th><th>Purpose</th></tr></thead>
                <tbody>
                  {REMOTE_MONITORING.streams.map((s2) => (
                    <tr key={s2.name}><td>{s2.name}</td><td>{s2.cadence}</td><td>{s2.purpose}</td></tr>
                  ))}
                </tbody>
              </table>
              <ul className="constraint-list">
                {REMOTE_MONITORING.constraints.map((c) => <li key={c}>{c}</li>)}
              </ul>
              <p className="drawer-note">
                This simulator has no network interface. The panel exists to show where
                connectivity metadata would sit in the interface.
              </p>
            </>
          )}

          {tab === 'service' && (
            <>
              <div className="subsection-title">Remote software distribution</div>
              <Row label="Update channel" value={SOFTWARE_DISTRIBUTION.channel} />
              <Row label="Code signing" value={SOFTWARE_DISTRIBUTION.signing} />
              <Row label="Verification" value={SOFTWARE_DISTRIBUTION.verification} />
              <Row label="Staged rollout" value={SOFTWARE_DISTRIBUTION.staging} />
              <Row label="Rollback" value={SOFTWARE_DISTRIBUTION.rollback} />
              <Row label="Clinical safeguard" value={SOFTWARE_DISTRIBUTION.clinicalGate} />
              <Row label="Record keeping" value={SOFTWARE_DISTRIBUTION.recordKeeping} />
              <Row label="Regulatory assessment" value={SOFTWARE_DISTRIBUTION.regulatory} />
              <p className="drawer-note">
                A field update to therapy-delivering software normally requires a change
                assessment to decide whether it can ship under the existing clearance.
              </p>
            </>
          )}

          {tab === 'trade' && (
            <>
              <div className="subsection-title">Export and trade compliance</div>
              {TRADE_COMPLIANCE.items.map((i) => (
                <Row key={i.label} label={i.label} value={i.value} />
              ))}
              <p className="drawer-note">{TRADE_COMPLIANCE.note}</p>
              <p className="drawer-note">
                Placeholders only. Classification and screening are determinations a
                trade-compliance function makes for the specific product and destination.
              </p>
            </>
          )}

          {tab === 'symbols' && (
            <>
              <div className="symbol-grid">
                {SYMBOL_GLOSSARY.map((s) => (
                  <div key={s.code} className="symbol-entry">
                    <s.Icon />
                    <div>
                      <b>{s.meaning}</b>
                      <span>{s.code}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="drawer-note">
                Simplified in-house drawings for layout only. Production labelling must
                reproduce the exact artwork from the referenced standards.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
