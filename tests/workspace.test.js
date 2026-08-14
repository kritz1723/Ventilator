import { describe, it, expect } from 'vitest'
import {
  PANELS, PANEL_IDS, PRESETS, DISPLAY_SCALES, MAX_COLUMNS,
  MIN_COLUMN_WEIGHT, MIN_PANEL_WEIGHT, DEFAULT_WORKSPACE, DEFAULT_DISPLAY_SCALE,
  findPanel, isVisible, visiblePanels, movePanel, resizeColumns, resizePanels,
  setPanelVisible, applyPreset, normaliseWorkspace, scaleFactor,
} from '../src/config/workspace.js'

const twoColumn = () => ({
  columns: [
    { weight: 1, panels: [{ id: 'lung', weight: 1 }] },
    { weight: 2, panels: [{ id: 'waveforms', weight: 2 }, { id: 'loops', weight: 1 }] },
  ],
})

describe('workspace shape', () => {
  it('places every catalogued panel in the default layout', () => {
    expect(visiblePanels(DEFAULT_WORKSPACE).sort()).toEqual([...PANEL_IDS].sort())
  })

  it('gives the waveforms more width than the animation by default', () => {
    const [left, right] = DEFAULT_WORKSPACE.columns
    expect(right.weight).toBeGreaterThan(left.weight)
    expect(visiblePanels({ columns: [right] })).toContain('waveforms')
  })

  it('locates a panel by column and index', () => {
    expect(findPanel(twoColumn(), 'loops')).toEqual({ column: 1, index: 1 })
    expect(findPanel(twoColumn(), 'nothing')).toBeNull()
  })
})

describe('moving panels', () => {
  it('reorders within a column', () => {
    const next = movePanel(twoColumn(), 'loops', 'up')
    expect(next.columns[1].panels.map((p) => p.id)).toEqual(['loops', 'waveforms'])
  })

  it('does not reorder past the top', () => {
    const next = movePanel(twoColumn(), 'waveforms', 'up')
    expect(next.columns[1].panels.map((p) => p.id)).toEqual(['waveforms', 'loops'])
  })

  it('carries a panel into the neighbouring column', () => {
    const next = movePanel(twoColumn(), 'loops', 'left')
    expect(next.columns[0].panels.map((p) => p.id)).toEqual(['lung', 'loops'])
    expect(next.columns[1].panels.map((p) => p.id)).toEqual(['waveforms'])
  })

  // A column emptied by a move would otherwise remain as a gap the operator
  // has to notice and clear up.
  it('removes a column emptied by a move', () => {
    const next = movePanel(twoColumn(), 'lung', 'right')
    expect(next.columns).toHaveLength(1)
    expect(next.columns[0].panels.map((p) => p.id)).toEqual(['lung', 'waveforms', 'loops'])
  })

  it('opens a new column past the outer edge', () => {
    const one = { columns: [{ weight: 1, panels: [{ id: 'lung', weight: 1 }, { id: 'loops', weight: 1 }] }] }
    const next = movePanel(one, 'loops', 'right')
    expect(next.columns).toHaveLength(2)
    expect(next.columns[1].panels.map((p) => p.id)).toEqual(['loops'])
  })

  it('refuses to open more columns than the maximum', () => {
    let ws = { columns: [] }
    ws = normaliseWorkspace({
      columns: PANEL_IDS.map((id) => ({ weight: 1, panels: [{ id, weight: 1 }] })),
    })
    expect(ws.columns).toHaveLength(MAX_COLUMNS)
    const next = movePanel(ws, ws.columns[MAX_COLUMNS - 1].panels[0].id, 'right')
    expect(next.columns).toHaveLength(MAX_COLUMNS)
    expect(visiblePanels(next).sort()).toEqual([...PANEL_IDS].sort())
  })

  it('leaves the layout alone for an unknown panel or direction', () => {
    const ws = twoColumn()
    expect(movePanel(ws, 'nothing', 'left')).toBe(ws)
    expect(movePanel(ws, 'loops', 'sideways')).toBe(ws)
  })

  it('never loses a panel while moving it around', () => {
    let ws = twoColumn()
    for (const dir of ['left', 'up', 'right', 'down', 'right', 'up', 'left']) {
      ws = movePanel(ws, 'loops', dir)
      expect(visiblePanels(ws).sort()).toEqual([...PANEL_IDS].sort())
    }
  })
})

describe('resizing', () => {
  // Taking from one side and giving to the other keeps the total fixed, so
  // the layout does not creep as it is adjusted.
  it('conserves total weight between two columns', () => {
    const ws = twoColumn()
    const total = ws.columns[0].weight + ws.columns[1].weight
    const next = resizeColumns(ws, 0, 0.4)
    expect(next.columns[0].weight + next.columns[1].weight).toBeCloseTo(total)
    expect(next.columns[0].weight).toBeGreaterThan(ws.columns[0].weight)
  })

  it('holds a column at its minimum rather than collapsing it', () => {
    const next = resizeColumns(twoColumn(), 0, -99)
    expect(next.columns[0].weight).toBeCloseTo(MIN_COLUMN_WEIGHT)
    expect(next.columns[1].weight).toBeGreaterThan(0)
  })

  it('holds the far column at its minimum too', () => {
    const next = resizeColumns(twoColumn(), 0, 99)
    expect(next.columns[1].weight).toBeCloseTo(MIN_COLUMN_WEIGHT)
  })

  it('conserves total weight between two stacked panels', () => {
    const ws = twoColumn()
    const total = ws.columns[1].panels[0].weight + ws.columns[1].panels[1].weight
    const next = resizePanels(ws, 1, 0, 0.3)
    const after = next.columns[1].panels[0].weight + next.columns[1].panels[1].weight
    expect(after).toBeCloseTo(total)
  })

  it('holds a panel at its minimum height', () => {
    const next = resizePanels(twoColumn(), 1, 0, -99)
    expect(next.columns[1].panels[0].weight).toBeCloseTo(MIN_PANEL_WEIGHT)
  })

  it('ignores a divider that does not exist', () => {
    const ws = twoColumn()
    expect(resizeColumns(ws, 5, 0.2)).toBe(ws)
    expect(resizePanels(ws, 0, 3, 0.2)).toBe(ws)
    expect(resizePanels(ws, 9, 0, 0.2)).toBe(ws)
  })
})

describe('showing and hiding panels', () => {
  it('hides a panel and restores it', () => {
    const hidden = setPanelVisible(twoColumn(), 'loops', false)
    expect(isVisible(hidden, 'loops')).toBe(false)
    const shown = setPanelVisible(hidden, 'loops', true)
    expect(isVisible(shown, 'loops')).toBe(true)
  })

  // An empty workspace shows nothing about the patient and offers no route
  // back to a populated one.
  it('refuses to hide the last remaining panel', () => {
    const one = { columns: [{ weight: 1, panels: [{ id: 'lung', weight: 1 }] }] }
    expect(setPanelVisible(one, 'lung', false)).toBe(one)
  })

  it('is a no-op when the panel is already in the wanted state', () => {
    const ws = twoColumn()
    expect(setPanelVisible(ws, 'loops', true)).toBe(ws)
    expect(setPanelVisible(ws, 'nothing', false)).toBe(ws)
  })
})

describe('presets', () => {
  it('offers a preset for each named arrangement', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(preset.label, preset.id).toBeTruthy()
      expect(preset.description, preset.id).toBeTruthy()
    }
  })

  it('shows every panel in every preset', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(visiblePanels(preset.workspace).sort(), preset.id).toEqual([...PANEL_IDS].sort())
    }
  })

  it('returns a copy so a preset cannot be edited in place', () => {
    const applied = applyPreset('balanced')
    applied.columns[0].weight = 99
    expect(PRESETS.balanced.workspace.columns[0].weight).not.toBe(99)
  })

  it('falls back to the default for an unknown preset', () => {
    expect(applyPreset('nope').columns).toHaveLength(DEFAULT_WORKSPACE.columns.length)
  })
})

describe('normalising a stored layout', () => {
  it('accepts a well-formed layout unchanged in content', () => {
    expect(visiblePanels(normaliseWorkspace(twoColumn())).sort()).toEqual([...PANEL_IDS].sort())
  })

  it('drops a panel that no longer exists', () => {
    const stored = {
      columns: [{ weight: 1, panels: [{ id: 'lung', weight: 1 }, { id: 'capnography', weight: 1 }] }],
    }
    expect(visiblePanels(normaliseWorkspace(stored))).toEqual(['lung'])
  })

  it('drops a duplicated panel rather than rendering it twice', () => {
    const stored = {
      columns: [
        { weight: 1, panels: [{ id: 'lung', weight: 1 }] },
        { weight: 1, panels: [{ id: 'lung', weight: 1 }] },
      ],
    }
    expect(visiblePanels(normaliseWorkspace(stored))).toEqual(['lung'])
  })

  it('replaces a non-positive weight with one', () => {
    const stored = { columns: [{ weight: 0, panels: [{ id: 'lung', weight: -3 }] }] }
    const ws = normaliseWorkspace(stored)
    expect(ws.columns[0].weight).toBe(1)
    expect(ws.columns[0].panels[0].weight).toBe(1)
  })

  it('caps the column count', () => {
    const stored = {
      columns: Array.from({ length: 8 }, (_, i) => ({ weight: 1, panels: [{ id: PANEL_IDS[i % PANEL_IDS.length], weight: 1 }] })),
    }
    expect(normaliseWorkspace(stored).columns.length).toBeLessThanOrEqual(MAX_COLUMNS)
  })

  it('falls back to the default for anything unusable', () => {
    for (const bad of [null, undefined, {}, { columns: 'no' }, { columns: [] }, { columns: [{ panels: [] }] }]) {
      expect(visiblePanels(normaliseWorkspace(bad)).sort()).toEqual([...PANEL_IDS].sort())
    }
  })

  it('accepts panels stored as bare identifiers', () => {
    const ws = normaliseWorkspace({ columns: [{ weight: 1, panels: ['lung', 'loops'] }] })
    expect(visiblePanels(ws)).toEqual(['lung', 'loops'])
    expect(ws.columns[0].panels[0].weight).toBe(1)
  })
})

describe('display scale', () => {
  it('names a factor for every offered scale', () => {
    for (const s of DISPLAY_SCALES) {
      expect(s.factor, s.id).toBeGreaterThan(0)
      expect(scaleFactor(s.id)).toBe(s.factor)
    }
  })

  it('leaves the interface unscaled by default', () => {
    expect(scaleFactor(DEFAULT_DISPLAY_SCALE)).toBe(1)
  })

  it('falls back to unscaled for an unknown scale', () => {
    expect(scaleFactor('enormous')).toBe(1)
  })

  it('offers scales in increasing order', () => {
    const factors = DISPLAY_SCALES.map((s) => s.factor)
    expect([...factors].sort((a, b) => a - b)).toEqual(factors)
  })
})

describe('panel catalogue', () => {
  it('describes every panel', () => {
    for (const id of PANEL_IDS) {
      expect(PANELS[id].label, id).toBeTruthy()
      expect(PANELS[id].description, id).toBeTruthy()
    }
  })
})
