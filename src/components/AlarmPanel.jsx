export default function AlarmPanel({ alarms }) {
  if (alarms.length === 0) {
    return <div className="alarm-panel alarm-panel-quiet">No active alarms</div>
  }

  return (
    <div className="alarm-panel alarm-panel-active">
      {alarms.map((alarm) => (
        <div key={alarm.id} className={`alarm alarm-${alarm.severity}`}>
          {alarm.message}
        </div>
      ))}
    </div>
  )
}
