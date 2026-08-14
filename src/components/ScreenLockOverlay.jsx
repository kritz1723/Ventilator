import { useEffect, useRef, useState } from 'react'
import { UNLOCK_HOLD_MS, unlockProgress, isUnlockComplete } from '../engine/screenLock.js'

// The overlay intercepts contact without hiding anything: it is transparent
// to the eye and opaque to the finger. Waveforms, numerics and alarms stay
// fully readable, because a lock that concealed the patient's data would
// trade one hazard for a worse one.
export default function ScreenLockOverlay({ locked, onUnlock, alarmActive }) {
  const [held, setHeld] = useState(0)
  const timerRef = useRef(null)
  const startedRef = useRef(0)

  useEffect(() => {
    if (!locked) setHeld(0)
  }, [locked])

  useEffect(() => () => clearInterval(timerRef.current), [])

  if (!locked) return null

  const begin = () => {
    startedRef.current = Date.now()
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedRef.current
      setHeld(elapsed)
      if (isUnlockComplete(elapsed)) {
        clearInterval(timerRef.current)
        setHeld(0)
        onUnlock()
      }
    }, 40)
  }

  const end = () => {
    clearInterval(timerRef.current)
    setHeld(0)
  }

  const progress = unlockProgress(held)

  return (
    <div className="lock-overlay" role="dialog" aria-modal="true" aria-label="Screen locked">
      <div className="lock-card">
        <span className="lock-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
          </svg>
        </span>
        <h2>Screen locked</h2>
        <p>
          The display stays live and alarms continue to annunciate. Controls are
          guarded against accidental contact.
        </p>

        <button
          type="button"
          className="lock-unlock"
          onPointerDown={begin}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        >
          <span
            className="lock-progress"
            style={{ transform: `scaleX(${progress.toFixed(3)})` }}
            aria-hidden="true"
          />
          <span className="lock-unlock-label">
            {held > 0
              ? 'Keep holding…'
              : `Press and hold ${Math.round(UNLOCK_HOLD_MS / 100) / 10}s to unlock`}
          </span>
        </button>

        {alarmActive && (
          <p className="lock-alarm-note">
            An alarm is active. Audio pause remains available while locked.
          </p>
        )}
      </div>
    </div>
  )
}
