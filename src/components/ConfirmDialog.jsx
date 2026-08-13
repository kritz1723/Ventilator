import { useEffect, useRef } from 'react'
import { CONFIRMATION_COPY } from '../engine/pendingChanges.js'

export default function ConfirmDialog({ action, detail, onAccept, onCancel }) {
  const acceptRef = useRef(null)

  useEffect(() => {
    if (!action) return undefined
    acceptRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [action, onCancel])

  if (!action) return null
  const copy = CONFIRMATION_COPY[action]
  if (!copy) return null

  return (
    <div className="confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{copy.title}</h2>
        <p className="confirm-body">{copy.body}</p>
        {detail && <p className="confirm-detail">{detail}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            ref={acceptRef}
            className="btn btn-confirm"
            onClick={onAccept}
          >{copy.accept}</button>
        </div>
      </div>
    </div>
  )
}
