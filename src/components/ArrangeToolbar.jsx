import {
  PANELS, PANEL_IDS, PRESETS, DISPLAY_SCALES, isVisible,
} from '../config/workspace.js'

// The controls for arranging the display, shown only while arrange mode is
// on so that the monitoring screen carries no chrome it does not need.
//
// Presets come first because they are what most people want: a named
// arrangement for the task in hand, reached in one press. Manual adjustment
// is there for the case a preset does not cover, not as the primary route.

export default function ArrangeToolbar({
  arranging, onArrangingChange,
  workspace, onWorkspaceChange, onPreset,
  displayScale, onDisplayScaleChange,
  onReset,
}) {
  if (!arranging) {
    return (
      <div className="ws-arrange-row">
      <button
        type="button"
        className="btn btn-ghost btn-tiny ws-arrange-toggle"
        onClick={() => onArrangingChange(true)}
        title="Move, resize and hide the panels on this screen"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="18" rx="1.5" />
          <rect x="14" y="3" width="7" height="8" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        Arrange
      </button>
      </div>
    )
  }

  return (
    <div className="ws-toolbar">
      <div className="ws-toolbar-group">
        <span className="ws-toolbar-label">Preset</span>
        {Object.values(PRESETS).map((p) => (
          <button
            key={p.id}
            type="button"
            className="facet"
            title={p.description}
            onClick={() => onPreset(p.id)}
          >{p.label}</button>
        ))}
      </div>

      <div className="ws-toolbar-group">
        <span className="ws-toolbar-label">Panels</span>
        {PANEL_IDS.map((id) => {
          const on = isVisible(workspace, id)
          return (
            <button
              key={id}
              type="button"
              role="switch"
              aria-checked={on}
              className={on ? 'facet active' : 'facet'}
              title={PANELS[id].description}
              onClick={() => onWorkspaceChange(id, !on)}
            >{PANELS[id].label}</button>
          )
        })}
      </div>

      <div className="ws-toolbar-group">
        <span className="ws-toolbar-label">Size</span>
        {DISPLAY_SCALES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={displayScale === s.id ? 'facet active' : 'facet'}
            title={s.hint}
            onClick={() => onDisplayScaleChange(s.id)}
          >{s.label}</button>
        ))}
      </div>

      <div className="ws-toolbar-group ws-toolbar-end">
        <button type="button" className="btn btn-ghost btn-tiny" onClick={onReset}>
          Reset layout
        </button>
        <button
          type="button"
          className="btn btn-confirm btn-tiny"
          onClick={() => onArrangingChange(false)}
        >Done</button>
      </div>

      <p className="ws-toolbar-note">
        Drag a divider to resize, or use the arrows on a panel to move it.
        Ventilation and alarms continue while arranging.
      </p>
    </div>
  )
}
