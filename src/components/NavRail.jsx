const ICONS = {
  home: (
    <>
      <path d="M4 11 12 4l8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  alarms: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
    </>
  ),
  trends: (
    <>
      <path d="M4 19V5M4 19h16" strokeLinecap="round" />
      <path d="M7 15l4-5 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h8M16 17h4" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="14" cy="17" r="2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" strokeLinecap="round" />
    </>
  ),
}

// The rail is the device's primary navigation: one destination per row, always
// in the same place, so the operator builds muscle memory for where a thing
// lives rather than hunting for it.
export default function NavRail({ page, onPageChange, alarmCount, onLock }) {
  const items = [
    { id: 'home', label: 'Home' },
    { id: 'alarms', label: 'Alarms', badge: alarmCount || null },
    { id: 'trends', label: 'Trends' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <nav className="nav-rail" aria-label="Main">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={page === item.id ? 'nav-item active' : 'nav-item'}
          aria-current={page === item.id ? 'page' : undefined}
          // Naming the button outright avoids the count being read ahead of
          // the destination, which is what the badge's position in the markup
          // would otherwise produce.
          aria-label={item.badge
            ? `${item.label}, ${item.badge === 1 ? '1 active alarm' : `${item.badge} active alarms`}`
            : undefined}
          onClick={() => onPageChange(item.id)}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
              {ICONS[item.id]}
            </svg>
            {/* The count is decoration over the icon; announcing it as part
                of the button's name gives "1 Alarms", which reads as a label
                nobody wrote. The label carries the count in words instead. */}
            {item.badge ? <span className="nav-badge" aria-hidden="true">{item.badge}</span> : null}
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}

      <button type="button" className="nav-item nav-lock" onClick={onLock}>
        <span className="nav-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
            {ICONS.lock}
          </svg>
        </span>
        <span className="nav-label">Lock</span>
      </button>
    </nav>
  )
}
