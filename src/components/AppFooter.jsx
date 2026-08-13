import { BUILD_ID, formatBuildTime } from '../config/buildInfo.js'
import { SOFTWARE_RECORD } from '../config/deviceIdentity.js'

export default function AppFooter() {
  const built = formatBuildTime()

  return (
    <footer className="app-footer">
      <span className="footer-sim">Simulation only — not for clinical use</span>
      <span className="footer-build">
        <span className="footer-label">Version</span>
        <span className="tnum">{SOFTWARE_RECORD.applicationVersion}</span>
        <span className="footer-sep">·</span>
        <span className="footer-label">Build</span>
        <code className="tnum">{BUILD_ID}</code>
        {built && (
          <>
            <span className="footer-sep">·</span>
            <span className="tnum">{built}</span>
          </>
        )}
      </span>
    </footer>
  )
}
