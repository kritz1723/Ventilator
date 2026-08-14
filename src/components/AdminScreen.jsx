import { useMemo, useState } from 'react'
import { REQUIREMENTS, requirementById } from '../docs/requirements.js'
import { RISKS, riskById, rpn } from '../docs/risks.js'
import { USER_PROFILES } from '../docs/userProfiles.js'

const TABS = [
  { id: 'requirements', label: 'Requirements' },
  { id: 'risks', label: 'Risk / DFMEA' },
  { id: 'trace', label: 'Traceability' },
  { id: 'profiles', label: 'User profiles' },
]

function severityClass(value) {
  if (value >= 8) return 'sev-hi'
  if (value >= 5) return 'sev-mid'
  return 'sev-lo'
}

function RequirementsTab() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')

  const types = ['all', ...new Set(REQUIREMENTS.map((r) => r.type))]
  const shown = REQUIREMENTS.filter((r) => {
    if (type !== 'all' && r.type !== type) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return `${r.id} ${r.title} ${r.text} ${r.feature}`.toLowerCase().includes(q)
  })

  return (
    <>
      <div className="doc-toolbar">
        <input
          className="log-search"
          type="search"
          placeholder="Search requirements…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="facet-options">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={type === t ? 'facet active' : 'facet'}
              onClick={() => setType(t)}
            >{t}</button>
          ))}
        </div>
        <span className="doc-count">{shown.length} of {REQUIREMENTS.length}</span>
      </div>

      <div className="doc-list">
        {shown.map((r) => (
          <article key={r.id} className="doc-card">
            <header className="doc-card-head">
              <span className="doc-id">{r.id}</span>
              <span className="doc-title">{r.title}</span>
              <span className={`doc-tag tag-${r.type.toLowerCase()}`}>{r.type}</span>
            </header>
            <p className="doc-text">{r.text}</p>
            <p className="doc-rationale"><b>Rationale.</b> {r.rationale}</p>
            <div className="doc-meta">
              {r.standard && <span className="doc-chip">{r.standard}</span>}
              <span className="doc-chip">Verify: {r.verification}</span>
              {r.profiles.map((p) => (
                <span key={p} className="doc-chip" title={USER_PROFILES[p]?.role}>{p}</span>
              ))}
              {r.risks.map((x) => <span key={x} className="doc-chip chip-risk">{x}</span>)}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function RisksTab() {
  const [sortByRpn, setSortByRpn] = useState(true)
  const rows = useMemo(() => {
    const list = [...RISKS]
    return sortByRpn ? list.sort((a, b) => rpn(b) - rpn(a)) : list
  }, [sortByRpn])

  return (
    <>
      <div className="doc-toolbar">
        <button
          type="button"
          className={sortByRpn ? 'facet active' : 'facet'}
          onClick={() => setSortByRpn((v) => !v)}
        >{sortByRpn ? 'Sorted by RPN' : 'Sorted by ID'}</button>
        <span className="doc-note-inline">
          RPN orders the review only. It is not an acceptance criterion — a
          high-severity failure stays unacceptable however rarely it occurs.
        </span>
      </div>

      <div className="doc-list">
        {rows.map((r) => (
          <article key={r.id} className="doc-card">
            <header className="doc-card-head">
              <span className="doc-id">{r.id}</span>
              <span className="doc-title">{r.item}</span>
              <span className="doc-tag">{r.category}</span>
            </header>
            <div className="risk-grid">
              <div><span className="risk-label">Failure mode</span>{r.failureMode}</div>
              <div><span className="risk-label">Effect</span>{r.effect}</div>
              <div><span className="risk-label">Cause</span>{r.cause}</div>
            </div>
            <div className="risk-scores">
              <span className={severityClass(r.severity)}>S {r.severity}</span>
              <span className={severityClass(r.occurrence)}>O {r.occurrence}</span>
              <span className={severityClass(r.detection)}>D {r.detection}</span>
              <span className="risk-rpn">RPN {rpn(r)}</span>
            </div>
            <div className="risk-controls">
              <span className="risk-label">Controls</span>
              <ul>{r.controls.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
            <p className="doc-rationale"><b>Residual.</b> {r.residual}</p>
            <div className="doc-meta">
              {r.mitigatedBy.map((x) => (
                <span key={x} className="doc-chip chip-req" title={requirementById(x)?.title}>{x}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function TraceabilityTab() {
  // Resolved in both directions: each requirement to the risks it controls,
  // and each risk back to the requirements that mitigate it.
  return (
    <div className="doc-list">
      <table className="info-table trace-table">
        <thead>
          <tr><th>Requirement</th><th>Type</th><th>Mitigates</th><th>Verified by</th></tr>
        </thead>
        <tbody>
          {REQUIREMENTS.map((r) => (
            <tr key={r.id}>
              <td><b>{r.id}</b><br /><span className="trace-sub">{r.title}</span></td>
              <td>{r.type}</td>
              <td>
                {r.risks.map((x) => (
                  <span key={x} className="doc-chip chip-risk" title={riskById(x)?.failureMode}>{x}</span>
                ))}
              </td>
              <td>{r.tests.map((t) => <span key={t} className="doc-chip">{t}</span>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProfilesTab() {
  return (
    <div className="doc-list">
      {Object.values(USER_PROFILES).map((p) => (
        <article key={p.id} className="doc-card">
          <header className="doc-card-head">
            <span className="doc-id">{p.id}</span>
            <span className="doc-title">{p.role}</span>
          </header>
          <div className="risk-grid">
            <div><span className="risk-label">Training</span>{p.training}</div>
            <div><span className="risk-label">Frequency of use</span>{p.frequency}</div>
            <div><span className="risk-label">Environment</span>{p.environment}</div>
          </div>
          <div className="risk-controls">
            <span className="risk-label">Goals</span>
            <ul>{p.goals.map((g) => <li key={g}>{g}</li>)}</ul>
          </div>
          <div className="risk-controls">
            <span className="risk-label">Use-related risks</span>
            <ul>{p.usabilityRisks.map((g) => <li key={g}>{g}</li>)}</ul>
          </div>
          <div className="doc-meta">
            {p.accessRights.map((a) => <span key={a} className="doc-chip">{a}</span>)}
          </div>
        </article>
      ))}
    </div>
  )
}

export default function AdminScreen({ onExit }) {
  const [tab, setTab] = useState('requirements')

  return (
    <div className="admin-screen">
      <header className="admin-head">
        <div>
          <span className="standby-badge admin-badge">Configuration</span>
          <h2>Development documents</h2>
          <p>
            Concept content for design review. Not reviewed, not approved, and not
            under change control.
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onExit}>Exit configuration</button>
      </header>

      <nav className="drawer-tabs admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'drawer-tab active' : 'drawer-tab'}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </nav>

      <div className="admin-body">
        {tab === 'requirements' && <RequirementsTab />}
        {tab === 'risks' && <RisksTab />}
        {tab === 'trace' && <TraceabilityTab />}
        {tab === 'profiles' && <ProfilesTab />}
      </div>
    </div>
  )
}
