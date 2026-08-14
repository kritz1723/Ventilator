import { useState } from 'react'
import {
  CLEARABLE, STORAGE_KEYS, isStorageAvailable, storedBytes, formatBytes,
} from '../state/persistence.js'
import { MAX_ALARM_EVENTS, MAX_OTHER_EVENTS, logCapacity } from '../engine/eventLog.js'

// Stored data, and the means to discard it.
//
// Persistence is a convenience that becomes a hazard the moment it is
// invisible: a setting nobody in the room chose, carried over from last
// week's class, looks like a device fault. This page therefore states plainly
// what is held, how much of it, and offers to clear it — with the two kinds
// separable, because a new scenario wants fresh settings while often wanting
// the preceding log kept for review.
//
// Clearing is confirmed rather than immediate. It is not reversible, and an
// event log is the record of a teaching session.

function Bar({ used, limit }) {
  const fraction = Math.min(used / Math.max(limit, 1), 1)
  return (
    <div className="storage-bar" aria-hidden="true">
      <span className="storage-bar-fill" style={{ width: `${(fraction * 100).toFixed(1)}%` }} />
    </div>
  )
}

export default function StorageTab({ events, restoredAt, storageError, onClear }) {
  const [pending, setPending] = useState(null)
  const available = isStorageAvailable()
  const bytes = storedBytes()
  const capacity = logCapacity(events)

  const confirmText = {
    [CLEARABLE.CONFIG]: 'Clear the stored configuration? Settings, patient setup, features, units, language and display layout return to their defaults. The event log is kept.',
    [CLEARABLE.LOG]: 'Clear the stored event log? Every recorded alarm and operator action is discarded. Configuration is kept.',
    [CLEARABLE.ALL]: 'Clear all stored data? Configuration returns to defaults and the whole event log is discarded.',
  }

  return (
    <>
      <div className="doc-toolbar">
        <span className="doc-note-inline">
          Configuration and the event log are held in this browser only. Nothing
          leaves the machine, nothing is sent anywhere, and clearing the
          browser's site data removes it. Running state is never stored: a
          reload always comes up in standby with nothing being delivered.
        </span>
      </div>

      {!available && (
        <p className="storage-warning">
          This browser is not allowing local storage, so configuration and the
          log will not survive a reload. The simulator runs unaffected in every
          other respect.
        </p>
      )}
      {storageError === 'quota' && (
        <p className="storage-warning">
          Storage is full, so the most recent changes were not saved. Clearing
          the event log below will recover space.
        </p>
      )}

      <div className="doc-list">
        <section className="storage-row">
          <div className="storage-info">
            <span className="licence-name">Configuration</span>
            <span className="licence-desc">
              Ventilation settings and alarm limits, patient setup, simulated
              lung, feature configuration, units, language, theme and waveform
              layout.
            </span>
            <span className="storage-meta">
              {formatBytes(bytes.config)} stored
              {restoredAt ? ` · restored from ${new Date(restoredAt).toLocaleString()}` : ' · nothing restored this session'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setPending(CLEARABLE.CONFIG)}
          >Clear configuration</button>
        </section>

        <section className="storage-row">
          <div className="storage-info">
            <span className="licence-name">Event log</span>
            <span className="licence-desc">
              Alarms and operator actions. The two are retained separately so a
              busy period of adjustments cannot push the alarms out of the
              record.
            </span>
            <div className="storage-capacity">
              <div>
                <span className="storage-meta">Alarms {capacity.alarms} of {MAX_ALARM_EVENTS}</span>
                <Bar used={capacity.alarms} limit={MAX_ALARM_EVENTS} />
              </div>
              <div>
                <span className="storage-meta">Other events {capacity.others} of {MAX_OTHER_EVENTS}</span>
                <Bar used={capacity.others} limit={MAX_OTHER_EVENTS} />
              </div>
            </div>
            <span className="storage-meta">
              {formatBytes(bytes.log)} stored · oldest entries of each kind are
              discarded once its limit is reached
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setPending(CLEARABLE.LOG)}
          >Clear log</button>
        </section>

        <section className="storage-row">
          <div className="storage-info">
            <span className="licence-name">Everything</span>
            <span className="licence-desc">
              Returns the simulator to the state of a machine that has never
              been used, keeping {formatBytes(bytes.total)} of storage free.
            </span>
            <span className="storage-meta">
              Keys used: {Object.values(STORAGE_KEYS).join(', ')}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-clear-all"
            onClick={() => setPending(CLEARABLE.ALL)}
          >Clear all stored data</button>
        </section>
      </div>

      {pending && (
        <div className="confirm-backdrop" role="presentation" onClick={() => setPending(null)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm clearing stored data"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Clear stored data</h2>
            <p className="confirm-body">{confirmText[pending]}</p>
            <p className="confirm-detail">This cannot be undone.</p>
            <div className="confirm-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-confirm"
                onClick={() => {
                  onClear(pending)
                  setPending(null)
                }}
              >Clear</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
