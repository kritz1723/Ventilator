// Workspace layout: which panels appear, where, and how large.
//
// A ventilator display is looked at by different people doing different
// things. Someone titrating PEEP wants the waveforms as large as the screen
// allows; someone teaching the mechanics of a stiff lung wants the animation
// dominant; someone reviewing loops wants those. A single fixed arrangement
// serves one of them and gets in the way of the other two.
//
// The model is deliberately a grid of columns rather than free-floating
// windows. Free positioning looks flexible and in practice produces
// overlapping panels, panels dragged off screen, and a layout nobody can
// restore. Columns of stacked panels can be rearranged into every
// arrangement that is actually wanted, and cannot be arranged into a broken
// one.
//
// Sizes are weights, not pixels. A weight survives a change of screen, a
// browser zoom, and the projector in the teaching room; a pixel height does
// not.

export const PANELS = {
  lung: {
    id: 'lung',
    label: 'Lung animation',
    description: 'Breath phase arcs, the simulated lung, and delivered volume.',
  },
  waveforms: {
    id: 'waveforms',
    label: 'Waveforms',
    description: 'Scalar traces with freeze, cursors and per-trace scaling.',
  },
  loops: {
    id: 'loops',
    label: 'Loops',
    description: 'Pressure–volume and flow–volume loops for the last breath.',
  },
}

export const PANEL_IDS = Object.keys(PANELS)

// A column narrower than this cannot show a waveform legibly, and a panel
// shorter than this cannot show a trace at all. The bounds exist so that a
// drag cannot produce a layout that has to be rebuilt from scratch.
export const MIN_COLUMN_WEIGHT = 0.35
export const MIN_PANEL_WEIGHT = 0.35
export const MAX_COLUMNS = 3

// Display scale multiplies typography and spacing across the shell. It is
// separate from panel sizing: one answers "how much room does this panel
// get", the other "how large is everything, given the viewing distance".
// A ventilator is read from the foot of the bed as often as from beside it.
export const DISPLAY_SCALES = [
  { id: 'compact', label: 'Compact', factor: 0.88, hint: 'More on screen, read from arm’s length' },
  { id: 'normal', label: 'Normal', factor: 1, hint: 'Default density' },
  { id: 'large', label: 'Large', factor: 1.14, hint: 'Read from across the bed space' },
  { id: 'xlarge', label: 'Extra large', factor: 1.3, hint: 'Projection and teaching rooms' },
]

export const DEFAULT_DISPLAY_SCALE = 'normal'

export function scaleFactor(id) {
  return DISPLAY_SCALES.find((s) => s.id === id)?.factor ?? 1
}

// The default gives the waveforms the larger share. They are the display the
// operator reads continuously; the animation is what they look at when
// something has changed.
export const DEFAULT_WORKSPACE = {
  columns: [
    { weight: 1, panels: [{ id: 'lung', weight: 1 }] },
    {
      weight: 1.55,
      panels: [
        { id: 'waveforms', weight: 2.1 },
        { id: 'loops', weight: 1 },
      ],
    },
  ],
}

export const PRESETS = {
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    description: 'Waveforms lead, with the animation and loops alongside.',
    workspace: DEFAULT_WORKSPACE,
  },
  waveforms: {
    id: 'waveforms',
    label: 'Waveform focus',
    description: 'Traces across the full width, with the animation reduced.',
    workspace: {
      columns: [
        {
          weight: 3,
          panels: [
            { id: 'waveforms', weight: 2.6 },
            { id: 'loops', weight: 1 },
          ],
        },
        { weight: 1, panels: [{ id: 'lung', weight: 1 }] },
      ],
    },
  },
  teaching: {
    id: 'teaching',
    label: 'Teaching',
    description: 'The animation dominant, with the waveforms beside it.',
    workspace: {
      columns: [
        { weight: 1.7, panels: [{ id: 'lung', weight: 1 }] },
        {
          weight: 1,
          panels: [
            { id: 'waveforms', weight: 1.6 },
            { id: 'loops', weight: 1 },
          ],
        },
      ],
    },
  },
  single: {
    id: 'single',
    label: 'Single column',
    description: 'Everything stacked, for a narrow or portrait screen.',
    workspace: {
      columns: [
        {
          weight: 1,
          panels: [
            { id: 'waveforms', weight: 2.2 },
            { id: 'lung', weight: 1.4 },
            { id: 'loops', weight: 1 },
          ],
        },
      ],
    },
  },
}

function clone(workspace) {
  return {
    columns: workspace.columns.map((c) => ({
      weight: c.weight,
      panels: c.panels.map((p) => ({ ...p })),
    })),
  }
}

// Columns left empty by a move are removed rather than left as a gap the
// operator has to notice and clear up.
function prune(workspace) {
  const columns = workspace.columns.filter((c) => c.panels.length > 0)
  return { columns: columns.length ? columns : clone(DEFAULT_WORKSPACE).columns }
}

export function findPanel(workspace, panelId) {
  for (let c = 0; c < workspace.columns.length; c += 1) {
    const p = workspace.columns[c].panels.findIndex((x) => x.id === panelId)
    if (p !== -1) return { column: c, index: p }
  }
  return null
}

export function isVisible(workspace, panelId) {
  return findPanel(workspace, panelId) != null
}

export function visiblePanels(workspace) {
  return workspace.columns.flatMap((c) => c.panels.map((p) => p.id))
}

// Moving within a column is reordering; moving past either end carries the
// panel into the neighbouring column, which is what the operator means by
// dragging it there.
export function movePanel(workspace, panelId, direction) {
  const at = findPanel(workspace, panelId)
  if (!at) return workspace
  const next = clone(workspace)
  const column = next.columns[at.column]
  const [panel] = column.panels.splice(at.index, 1)

  if (direction === 'up') {
    column.panels.splice(Math.max(0, at.index - 1), 0, panel)
  } else if (direction === 'down') {
    column.panels.splice(Math.min(column.panels.length, at.index + 1), 0, panel)
  } else if (direction === 'left') {
    if (at.column === 0) {
      // Carried off the left edge: a new column opens for it, up to the
      // limit beyond which columns are too narrow to be worth having.
      if (next.columns.length >= MAX_COLUMNS) {
        column.panels.splice(at.index, 0, panel)
        return workspace
      }
      next.columns.unshift({ weight: 1, panels: [panel] })
    } else {
      next.columns[at.column - 1].panels.push(panel)
    }
  } else if (direction === 'right') {
    if (at.column === next.columns.length - 1) {
      if (next.columns.length >= MAX_COLUMNS) {
        column.panels.splice(at.index, 0, panel)
        return workspace
      }
      next.columns.push({ weight: 1, panels: [panel] })
    } else {
      next.columns[at.column + 1].panels.unshift(panel)
    }
  } else {
    column.panels.splice(at.index, 0, panel)
    return workspace
  }

  return prune(next)
}

// Dragging a divider takes from one side and gives to the other, so the
// total stays put and the layout does not creep as it is adjusted.
export function resizeColumns(workspace, dividerIndex, delta) {
  const next = clone(workspace)
  const a = next.columns[dividerIndex]
  const b = next.columns[dividerIndex + 1]
  if (!a || !b) return workspace
  const total = a.weight + b.weight
  const wantedA = a.weight + delta
  a.weight = Math.min(Math.max(wantedA, MIN_COLUMN_WEIGHT), total - MIN_COLUMN_WEIGHT)
  b.weight = total - a.weight
  return next
}

export function resizePanels(workspace, columnIndex, dividerIndex, delta) {
  const next = clone(workspace)
  const column = next.columns[columnIndex]
  if (!column) return workspace
  const a = column.panels[dividerIndex]
  const b = column.panels[dividerIndex + 1]
  if (!a || !b) return workspace
  const total = a.weight + b.weight
  const wantedA = a.weight + delta
  a.weight = Math.min(Math.max(wantedA, MIN_PANEL_WEIGHT), total - MIN_PANEL_WEIGHT)
  b.weight = total - a.weight
  return next
}

// Hiding a panel is a layout decision, not a licence one: an operator who
// does not want loops on screen should not have to give up the feature.
export function setPanelVisible(workspace, panelId, visible) {
  const at = findPanel(workspace, panelId)
  if (visible && !at) {
    const next = clone(workspace)
    const target = next.columns[next.columns.length - 1]
    target.panels.push({ id: panelId, weight: 1 })
    return next
  }
  if (!visible && at) {
    // The last panel is never removed: an empty workspace shows nothing
    // about the patient and offers no way back.
    if (visiblePanels(workspace).length <= 1) return workspace
    const next = clone(workspace)
    next.columns[at.column].panels.splice(at.index, 1)
    return prune(next)
  }
  return workspace
}

export function applyPreset(presetId) {
  const preset = PRESETS[presetId]
  return preset ? clone(preset.workspace) : clone(DEFAULT_WORKSPACE)
}

// Stored layouts are checked before use rather than trusted. A layout naming
// a panel that no longer exists, or carrying a weight of zero, would render
// as an invisible or empty column that looks like a fault.
export function normaliseWorkspace(workspace) {
  if (!workspace || !Array.isArray(workspace.columns)) return clone(DEFAULT_WORKSPACE)
  const seen = new Set()
  const columns = []
  for (const column of workspace.columns.slice(0, MAX_COLUMNS)) {
    if (!column || !Array.isArray(column.panels)) continue
    const panels = []
    for (const panel of column.panels) {
      const id = typeof panel === 'string' ? panel : panel?.id
      if (!PANELS[id] || seen.has(id)) continue
      seen.add(id)
      const weight = Number(panel?.weight)
      panels.push({ id, weight: Number.isFinite(weight) && weight > 0 ? weight : 1 })
    }
    if (!panels.length) continue
    const weight = Number(column.weight)
    columns.push({ weight: Number.isFinite(weight) && weight > 0 ? weight : 1, panels })
  }
  if (!columns.length) return clone(DEFAULT_WORKSPACE)
  return { columns }
}
