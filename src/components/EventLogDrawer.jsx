import { useMemo, useState } from 'react'
import {
  EVENT_CATEGORY, CATEGORY_LABEL, ACTION_CATEGORIES, filterEvents, toCsv,
} from '../engine/eventLog.js'

const ALL_CATEGORIES = Object.values(EVENT_CATEGORY)

// The two filters that matter most get a one-click preset, since separating
// "what the device reported" from "what the operator did" is the question
// asked of a log most often.
const PRESETS = [
  { id: 'all', label: 'All', categories: null },
  { id: 'alarms', label: 'Alarms', categories: [EVENT_CATEGORY.ALARM] },
  { id: 'actions', label: 'Actions', categories: ACTION_CATEGORIES },
]

function timeOf(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '--:--:--' : d.toTimeString().slice(0, 8)
}

export default function EventLogDrawer({ open, onClose, events }) {
  const [preset, setPreset] = useState('all')
  const [categories, setCategories] = useState(null)
  const [severities, setSeverities] = useState([])
  const [query, setQuery] = useState('')

  const active = categories ?? PRESETS.find((p) => p.id === preset)?.categories ?? null

  const filtered = useMemo(
    () => filterEvents(events, { categories: active, severities, query }),
    [events, active, severities, query],
  )

  if (!open) return null

  const applyPreset = (id) => {
    setPreset(id)
    setCategories(null)
    setSeverities([])
  }

  const toggleCategory = (c) => {
    const base = active ?? ALL_CATEGORIES
    const next = base.includes(c) ? base.filter((x) => x !== c) : [...base, c]
    setCategories(next.length === ALL_CATEGORIES.length ? null : next)
    setPreset('custom')
  }

  const toggleSeverity = (s) => {
    setSeverities((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const copyCsv = () => {
    navigator.clipboard?.writeText(toCsv(filtered))
  }

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="drawer drawer-wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Event log"
      >
        <header className="drawer-head">
          <div>
            <h2>Event log</h2>
            <p>{filtered.length} of {events.length} entries</p>
          </div>
          <div className="log-head-actions">
            <button type="button" className="btn btn-ghost btn-tiny" onClick={copyCsv}>Copy CSV</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </header>

        <div className="log-filters">
          <div className="log-presets" role="group" aria-label="Quick filter">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={preset === p.id ? 'chip active' : 'chip'}
                onClick={() => applyPreset(p.id)}
              >{p.label}</button>
            ))}
          </div>

          <input
            className="log-search"
            type="search"
            placeholder="Search messages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="log-facets">
            <div className="facet-group">
              <span className="facet-title">Category</span>
              <div className="facet-options">
                {ALL_CATEGORIES.map((c) => {
                  const on = active ? active.includes(c) : true
                  return (
                    <button
                      key={c}
                      type="button"
                      className={on ? 'facet active' : 'facet'}
                      onClick={() => toggleCategory(c)}
                    >{CATEGORY_LABEL[c]}</button>
                  )
                })}
              </div>
            </div>

            <div className="facet-group">
              <span className="facet-title">Priority</span>
              <div className="facet-options">
                {['high', 'medium', 'low'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={severities.includes(s) ? `facet active facet-${s}` : 'facet'}
                    onClick={() => toggleSeverity(s)}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-body log-body">
          {filtered.length === 0 ? (
            <p className="log-empty">No entries match the current filter.</p>
          ) : (
            <ol className="log-list">
              {filtered.map((e) => (
                <li key={e.seq} className={`log-entry log-${e.category}${e.severity ? ` sev-${e.severity}` : ''}`}>
                  <span className="log-time tnum">{timeOf(e.at)}</span>
                  <span className="log-cat">{CATEGORY_LABEL[e.category]}</span>
                  <span className="log-msg">
                    {e.message}
                    {e.detail && <em className="log-detail">{e.detail}</em>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  )
}
