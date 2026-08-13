import { PRIORITY_RANK } from '../engine/alarms.js'

export default function AlarmBanner({ alarms, audioPaused, pauseRemaining, onPauseAudio }) {
  const worst = alarms.length
    ? alarms.reduce((w, a) => (PRIORITY_RANK[a.priority] > PRIORITY_RANK[w] ? a.priority : w), 'low')
    : null

  return (
    <div className={`alarm-banner${worst ? ` alarm-banner-${worst}` : ' alarm-banner-quiet'}`}>
      <div className="alarm-banner-main">
        {alarms.length === 0 ? (
          <div className="alarm-line">
            <span className="alarm-status-dot" />
            <span>No active alarms</span>
          </div>
        ) : (
          alarms.map((alarm) => (
            <div key={alarm.id} className={`alarm-line alarm-line-${alarm.priority}`}>
              <span className="alarm-chip">{alarm.label}</span>
              <span className="alarm-message">{alarm.message}</span>
              <span className="alarm-detail">{alarm.detail}</span>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className={audioPaused ? 'audio-pause active' : 'audio-pause'}
        onClick={onPauseAudio}
        aria-label="Pause alarm audio"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path
            d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"
            fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
          />
          <path d="M16 8.5l5 7M21 8.5l-5 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>{audioPaused ? `${pauseRemaining}s` : 'Audio pause'}</span>
      </button>
    </div>
  )
}
