import { useEffect, useRef, useState } from 'react'
import {
  TRACE_CATALOG, SWEEP_OPTIONS, MIN_TRACES, MAX_TRACES, scaleFor, moveTrace,
} from '../config/traceCatalog.js'

const SAMPLE_HZ = 50

// Trace and grid colours come from the active theme's CSS custom properties
// so the canvas repaints correctly when the theme changes.
function themeColors(el, token) {
  const cs = getComputedStyle(el)
  return {
    trace: cs.getPropertyValue(token).trim() || '#4cc4f5',
    grid: cs.getPropertyValue('--grid-line').trim() || 'rgba(255,255,255,0.05)',
    zero: cs.getPropertyValue('--grid-zero').trim() || 'rgba(255,255,255,0.2)',
    axis: cs.getPropertyValue('--axis-text').trim() || 'rgba(255,255,255,0.3)',
  }
}

function withAlpha(color, alpha) {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color + Math.round(alpha * 255).toString(16).padStart(2, '0')
  }
  return color
}

function niceTicks(min, max) {
  const ticks = [min, min + (max - min) / 2, max]
  if (min < 0 && max > 0 && !ticks.includes(0)) ticks.push(0)
  return [...new Set(ticks)].sort((a, b) => a - b)
}

function draw(canvas, data, channel, scale, sweepSeconds, cursors) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (!w || !h) return

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const colors = themeColors(canvas, channel.token)
  const padLeft = 38
  const plotW = w - padLeft
  const yFor = (v) => {
    const clamped = Math.min(Math.max(v, scale.min), scale.max)
    return h - ((clamped - scale.min) / (scale.max - scale.min)) * h
  }

  // One vertical gridline per second of the selected sweep.
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1
  for (let s = 1; s < sweepSeconds; s += 1) {
    const x = padLeft + (s / sweepSeconds) * plotW
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const tick of niceTicks(scale.min, scale.max)) {
    const y = yFor(tick)
    const isZero = tick === 0
    ctx.strokeStyle = isZero ? colors.zero : colors.grid
    ctx.beginPath()
    ctx.moveTo(padLeft, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    ctx.fillStyle = colors.axis
    ctx.fillText(String(Math.round(tick)), padLeft - 6, Math.min(Math.max(y, 7), h - 7))
  }

  if (data.length < 2) return

  const xFor = (i) => padLeft + (i / (data.length - 1)) * plotW
  const baselineY = yFor(Math.max(scale.min, 0))

  const fill = ctx.createLinearGradient(0, 0, 0, h)
  fill.addColorStop(0, withAlpha(colors.trace, 0.22))
  fill.addColorStop(1, withAlpha(colors.trace, 0))
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(xFor(0), baselineY)
  data.forEach((s, i) => ctx.lineTo(xFor(i), yFor(s[channel.key])))
  ctx.lineTo(xFor(data.length - 1), baselineY)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  data.forEach((s, i) => {
    const x = xFor(i)
    const y = yFor(s[channel.key])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = colors.trace
  ctx.lineWidth = 1.9
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = colors.trace
  ctx.shadowBlur = 9
  ctx.stroke()
  ctx.shadowBlur = 0

  const active = (cursors ?? []).filter((c) => c != null)
  if (!active.length) {
    const lastX = xFor(data.length - 1)
    const lastY = yFor(data[data.length - 1][channel.key])
    ctx.fillStyle = colors.trace
    ctx.beginPath()
    ctx.arc(lastX, lastY, 2.6, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  const clamp = (i) => Math.min(Math.max(i, 0), data.length - 1)

  // Shade the interval when both cursors are placed, so the span being
  // measured is visible rather than having to be inferred from two lines.
  if (active.length === 2) {
    const [a, b] = active.map(clamp).sort((x, y) => x - y)
    ctx.fillStyle = withAlpha(colors.trace, 0.09)
    ctx.fillRect(xFor(a), 0, xFor(b) - xFor(a), h)
  }

  active.forEach((raw, n) => {
    const i = clamp(raw)
    const cx = xFor(i)
    const cy = yFor(data[i][channel.key])
    ctx.strokeStyle = colors.axis
    ctx.lineWidth = 1
    // The reference cursor is dashed and the measuring cursor solid, so the
    // two are distinguishable without relying on colour.
    ctx.setLineDash(n === 0 ? [] : [4, 3])
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = colors.trace
    ctx.beginPath()
    ctx.arc(cx, cy, 3.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = colors.zero
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(cx, cy, 3.6, 0, Math.PI * 2)
    ctx.stroke()
  })
}

function TraceRow({
  data, channel, scaleIndex, sweepSeconds, cursors, onScrub,
  editing, onScaleChange, onRemove, onMoveUp, onMoveDown, compact, canRemove,
}) {
  const canvasRef = useRef(null)
  const scale = scaleFor(channel.id, scaleIndex)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const render = () => draw(canvas, data, channel, scale, sweepSeconds, cursors)
    render()
    const ro = new ResizeObserver(render)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [data, channel, scale, sweepSeconds, cursors])

  const handlePointer = (e) => {
    if (!onScrub) return
    const rect = e.currentTarget.getBoundingClientRect()
    const padLeft = 38
    const frac = (e.clientX - rect.left - padLeft) / (rect.width - padLeft)
    onScrub(Math.round(Math.min(Math.max(frac, 0), 1) * (data.length - 1)))
  }

  const readAt = (i) => (
    i == null || !data.length
      ? null
      : data[Math.min(Math.max(i, 0), data.length - 1)][channel.key]
  )
  const primary = readAt(cursors?.[0])
  const secondary = readAt(cursors?.[1])
  const delta = primary != null && secondary != null ? secondary - primary : null

  return (
    <div className={compact ? 'trace-row trace-row-compact' : 'trace-row'}>
      <div className="trace-legend">
        <span className="trace-dot" style={{ background: `var(${channel.token})` }} />
        <span className="trace-name">{channel.label}</span>
        <span className="trace-unit">{channel.unit}</span>
        {primary != null && (
          <span className="trace-cursor-value tnum" style={{ color: `var(${channel.token})` }}>
            {primary.toFixed(1)}
          </span>
        )}
        {secondary != null && (
          <span className="trace-cursor-second tnum">{secondary.toFixed(1)}</span>
        )}
        {delta != null && (
          <span className="trace-cursor-delta tnum">
            Δ {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        )}
        {editing && (
          <div className="trace-edit">
            <select
              value={scaleIndex}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              aria-label={`${channel.label} scale`}
            >
              {channel.scales.map((s, i) => (
                <option key={s.label} value={i}>{s.label}</option>
              ))}
            </select>
            <div className="trace-edit-buttons">
              <button type="button" onClick={onMoveUp} aria-label={`Move ${channel.label} up`}>↑</button>
              <button type="button" onClick={onMoveDown} aria-label={`Move ${channel.label} down`}>↓</button>
              <button
                type="button"
                onClick={onRemove}
                disabled={!canRemove}
                aria-label={`Remove ${channel.label}`}
              >✕</button>
            </div>
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className={onScrub ? 'trace-canvas trace-canvas-scrub' : 'trace-canvas'}
        onPointerDown={handlePointer}
        onPointerMove={(e) => { if (e.buttons === 1) handlePointer(e) }}
      />
    </div>
  )
}

export default function WaveformDisplay({
  waveform, layout, onLayoutChange, frozen, onToggleFreeze, cursors, onCursorsChange,
  t = (k) => k,
}) {
  const [editing, setEditing] = useState(false)
  const { sweepSeconds, traces } = layout

  // Show only the tail the selected sweep covers, so changing sweep length
  // rescales time rather than leaving the trace partly empty.
  const wanted = Math.round(sweepSeconds * SAMPLE_HZ)
  const data = waveform.length > wanted ? waveform.slice(-wanted) : waveform

  // Cursor position expressed as time before the newest sample.
  const timeAt = (i) => (
    i == null || data.length < 2
      ? null
      : (i / (data.length - 1)) * sweepSeconds - sweepSeconds
  )
  const t0 = timeAt(cursors?.[0])
  const t1 = timeAt(cursors?.[1])
  const dt = t0 != null && t1 != null ? t1 - t0 : null

  // First click sets the reference, second sets the measuring cursor, third
  // starts over — so two-point measurement needs no mode switch.
  const placeCursor = (index) => {
    if (!onCursorsChange) return
    const [a, b] = cursors ?? []
    if (a == null) onCursorsChange([index, null])
    else if (b == null) onCursorsChange([a, index])
    else onCursorsChange([index, null])
  }

  const setTraces = (next) => onLayoutChange({ ...layout, traces: next })

  const addTrace = (id) => {
    if (traces.length >= MAX_TRACES) return
    setTraces([...traces, { id, scale: TRACE_CATALOG[id].defaultScale }])
  }

  return (
    <div className={frozen ? 'waveform-display panel is-frozen' : 'waveform-display panel'}>
      <div className="waveform-header">
        <span className="panel-title">{t('panel.waveforms')}</span>
        <div className="waveform-tools">
          {frozen && t0 != null && (
            <span className="cursor-time tnum">{t0.toFixed(2)}s</span>
          )}
          {frozen && t1 != null && (
            <span className="cursor-time cursor-time-second tnum">{t1.toFixed(2)}s</span>
          )}
          {frozen && dt != null && (
            <span className="cursor-delta tnum">Δt {dt > 0 ? '+' : ''}{dt.toFixed(2)}s</span>
          )}
          {frozen && cursors?.[0] != null && (
            <button
              type="button"
              className="btn btn-ghost btn-tiny"
              onClick={() => onCursorsChange([null, null])}
            >Clear cursors</button>
          )}
          <label className="sweep-select">
            <span>{t('field.sweep')}</span>
            <select
              value={sweepSeconds}
              disabled={!onLayoutChange}
              onChange={(e) => onLayoutChange({ ...layout, sweepSeconds: Number(e.target.value) })}
            >
              {SWEEP_OPTIONS.map((s) => <option key={s} value={s}>{s}s</option>)}
            </select>
          </label>
          {onLayoutChange && (
            <button
              type="button"
              className={editing ? 'btn btn-ghost btn-tiny freeze-active' : 'btn btn-ghost btn-tiny'}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? t('action.done') : t('action.layout')}
            </button>
          )}
          <button
            type="button"
            className={frozen ? 'btn btn-ghost btn-tiny freeze-active' : 'btn btn-ghost btn-tiny'}
            onClick={onToggleFreeze}
          >
            {frozen ? t('action.resume') : t('action.freeze')}
          </button>
        </div>
      </div>

      {frozen && (
        <p className="freeze-hint">
          {cursors?.[0] == null
            ? 'Frozen — click a trace to place the reference cursor.'
            : cursors?.[1] == null
              ? 'Click again to place a second cursor and read the difference between them.'
              : 'Two cursors placed. Click again to start a new measurement.'}
        </p>
      )}

      {editing && onLayoutChange && (
        <div className="layout-editor">
          <span className="layout-hint">
            {traces.length} of {MAX_TRACES} traces. A channel can appear more than once to
            show it at two scales at the same time.
          </span>
          <div className="layout-add">
            {Object.values(TRACE_CATALOG).map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                disabled={traces.length >= MAX_TRACES}
                onClick={() => addTrace(c.id)}
              >+ {c.label}</button>
            ))}
          </div>
        </div>
      )}

      {traces.map((t, i) => {
        const channel = TRACE_CATALOG[t.id]
        if (!channel) return null
        return (
          <TraceRow
            key={`${t.id}-${i}`}
            data={data}
            channel={channel}
            scaleIndex={t.scale}
            sweepSeconds={sweepSeconds}
            cursors={frozen ? cursors : null}
            onScrub={frozen ? placeCursor : null}
            editing={editing}
            compact={traces.length >= 5}
            canRemove={traces.length > MIN_TRACES}
            onScaleChange={(scale) => setTraces(traces.map((x, j) => (j === i ? { ...x, scale } : x)))}
            onRemove={() => {
              if (traces.length <= MIN_TRACES) return
              setTraces(traces.filter((_, j) => j !== i))
            }}
            onMoveUp={() => setTraces(moveTrace(traces, i, i - 1))}
            onMoveDown={() => setTraces(moveTrace(traces, i, i + 1))}
          />
        )
      })}
    </div>
  )
}
