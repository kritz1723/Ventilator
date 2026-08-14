import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PANELS, MAX_COLUMNS, movePanel, resizeColumns, resizePanels,
} from '../config/workspace.js'

// Renders the workspace and, in arrange mode, the controls that change it.
//
// Rearranging is behind a mode rather than always live. During ventilation
// the operator's pointer is on the display constantly — placing cursors,
// reading traces — and a layout that reorganises itself on a stray drag is
// worse than one that cannot be changed at all. Arrange mode makes moving
// deliberate, and leaves the display fully readable while it is on: the
// waveforms keep running underneath the handles.
//
// Dividers resize by dragging. The arithmetic is in the workspace model, so
// what this file contributes is only the translation from pointer travel to
// a weight delta.

function Divider({ orientation, onDrag, label }) {
  const ref = useRef(null)
  const state = useRef(null)

  const onPointerDown = (e) => {
    const el = ref.current
    if (!el) return
    // Measuring against the container gives a delta in the same units as the
    // weights: a drag across half the container moves half the total weight.
    const parent = el.parentElement
    const rect = parent.getBoundingClientRect()
    state.current = {
      start: orientation === 'vertical' ? e.clientX : e.clientY,
      extent: orientation === 'vertical' ? rect.width : rect.height,
    }
    el.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!state.current) return
    const { start, extent } = state.current
    const moved = (orientation === 'vertical' ? e.clientX : e.clientY) - start
    if (!extent) return
    state.current.start = orientation === 'vertical' ? e.clientX : e.clientY
    onDrag((moved / extent) * 2)
  }

  const onPointerUp = (e) => {
    state.current = null
    ref.current?.releasePointerCapture?.(e.pointerId)
  }

  // Keyboard resizing, so the layout is not reachable by pointer alone.
  const onKeyDown = (e) => {
    const step = 0.08
    if (orientation === 'vertical' && e.key === 'ArrowLeft') onDrag(-step)
    else if (orientation === 'vertical' && e.key === 'ArrowRight') onDrag(step)
    else if (orientation === 'horizontal' && e.key === 'ArrowUp') onDrag(-step)
    else if (orientation === 'horizontal' && e.key === 'ArrowDown') onDrag(step)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={ref}
      className={`ws-divider ws-divider-${orientation}`}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={orientation}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <span className="ws-divider-grip" aria-hidden="true" />
    </div>
  )
}

function ArrangeBar({ panel, columnIndex, columnCount, index, panelCount, onMove, onHide }) {
  const meta = PANELS[panel.id]
  const canAddColumn = columnCount < MAX_COLUMNS
  return (
    <div className="ws-arrange-bar">
      <span className="ws-arrange-name">{meta?.label ?? panel.id}</span>
      <div className="ws-arrange-actions">
        <button
          type="button" className="ws-move" title="Move left"
          aria-label={`Move ${meta?.label} left`}
          disabled={columnIndex === 0 && !canAddColumn}
          onClick={() => onMove('left')}
        >◀</button>
        <button
          type="button" className="ws-move" title="Move up"
          aria-label={`Move ${meta?.label} up`}
          disabled={index === 0}
          onClick={() => onMove('up')}
        >▲</button>
        <button
          type="button" className="ws-move" title="Move down"
          aria-label={`Move ${meta?.label} down`}
          disabled={index === panelCount - 1}
          onClick={() => onMove('down')}
        >▼</button>
        <button
          type="button" className="ws-move" title="Move right"
          aria-label={`Move ${meta?.label} right`}
          disabled={columnIndex === columnCount - 1 && !canAddColumn}
          onClick={() => onMove('right')}
        >▶</button>
        <button
          type="button" className="ws-move ws-hide" title="Hide this panel"
          aria-label={`Hide ${meta?.label}`}
          onClick={onHide}
        >✕</button>
      </div>
    </div>
  )
}

export default function Workspace({
  workspace, onWorkspaceChange, arranging, render, onHidePanel,
}) {
  // Dragging updates on every pointer move, so the change is applied to the
  // value being dragged rather than to the value at the start of the drag.
  const wsRef = useRef(workspace)
  useEffect(() => { wsRef.current = workspace }, [workspace])

  const dragColumns = useCallback((dividerIndex, delta) => {
    onWorkspaceChange(resizeColumns(wsRef.current, dividerIndex, delta))
  }, [onWorkspaceChange])

  const dragPanels = useCallback((columnIndex, dividerIndex, delta) => {
    onWorkspaceChange(resizePanels(wsRef.current, columnIndex, dividerIndex, delta))
  }, [onWorkspaceChange])

  const move = useCallback((panelId, direction) => {
    onWorkspaceChange(movePanel(wsRef.current, panelId, direction))
  }, [onWorkspaceChange])

  const columns = workspace.columns
  const template = columns
    .map((c) => `minmax(0, ${c.weight}fr)`)
    .join(' var(--ws-divider) ')

  return (
    <div
      className={arranging ? 'workspace is-arranging' : 'workspace'}
      style={{ gridTemplateColumns: template }}
    >
      {columns.map((column, ci) => {
        const rows = column.panels
          .map((p) => `minmax(0, ${p.weight}fr)`)
          .join(' var(--ws-divider) ')
        return [
          <div
            key={`col-${ci}`}
            className="ws-column"
            style={{ gridTemplateRows: rows }}
          >
            {column.panels.map((panel, pi) => [
              <div key={panel.id} className="ws-panel">
                {arranging && (
                  <ArrangeBar
                    panel={panel}
                    columnIndex={ci}
                    columnCount={columns.length}
                    index={pi}
                    panelCount={column.panels.length}
                    onMove={(dir) => move(panel.id, dir)}
                    onHide={() => onHidePanel(panel.id)}
                  />
                )}
                <div className="ws-panel-body">{render(panel.id)}</div>
              </div>,
              pi < column.panels.length - 1 && arranging ? (
                <Divider
                  key={`div-${panel.id}`}
                  orientation="horizontal"
                  label={`Resize ${PANELS[panel.id]?.label} against the panel below`}
                  onDrag={(d) => dragPanels(ci, pi, d)}
                />
              ) : pi < column.panels.length - 1 ? (
                <div key={`gap-${panel.id}`} className="ws-gap" />
              ) : null,
            ])}
          </div>,
          ci < columns.length - 1 && arranging ? (
            <Divider
              key={`coldiv-${ci}`}
              orientation="vertical"
              label={`Resize column ${ci + 1} against column ${ci + 2}`}
              onDrag={(d) => dragColumns(ci, d)}
            />
          ) : ci < columns.length - 1 ? (
            <div key={`colgap-${ci}`} className="ws-gap" />
          ) : null,
        ]
      })}
    </div>
  )
}

export function useArrangeMode() {
  return useState(false)
}
