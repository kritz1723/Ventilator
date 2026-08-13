export default function AlarmPanel({ alarms }) {
  if (alarms.length === 0) {
    return (
      <div className="alarm-bar alarm-bar-quiet">
        <span className="alarm-status-dot" />
        <span>No active alarms</span>
      </div>
    )
  }

  const worst = alarms.some((a) => a.severity === 'high') ? 'high' : 'medium'

  return (
    <div className={`alarm-bar alarm-bar-active alarm-bar-${worst}`}>
      {alarms.map((alarm) => (
        <div key={alarm.id} className={`alarm alarm-${alarm.severity}`}>
          <span className="alarm-icon" aria-hidden="true" />
          <span>{alarm.message}</span>
        </div>
      ))}
    </div>
  )
}
