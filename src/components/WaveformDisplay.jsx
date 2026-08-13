import { useEffect, useRef } from 'react'

const TRACES = [
  { key: 'pressure', label: 'Paw', unit: 'cmH₂O', token: '--paw', min: -5, max: 45 },
  { key: 'flow', label: 'Flow', unit: 'L/min', token: '--flow', min: -150, max: 150 },
  { key: 'volume', label: 'Volume', unit: 'mL', token: '--volume', min: 0, max: 800 },
]

const SWEEP_SECONDS = 10

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
  // Works for hex tokens; falls back to the colour itself for other formats.
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

function draw(canvas, data, trace, cursorIndex = null) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const cssWidth = canvas.clientWidth
  const cssHeight = canvas.clientHeight
  if (!cssWidth || !cssHeight) return

  if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(cssHeight * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssWidth, cssHeight)

  const colors = themeColors(canvas, trace.token)
  const padLeft = 34
  const plotW = cssWidth - padLeft
  const yFor = (v) => {
    const clamped = Math.min(Math.max(v, trace.min), trace.max)
    return cssHeight - ((clamped - trace.min) / (trace.max - trace.min)) * cssHeight
  }

  // Vertical time gridlines, one per second
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1
  for (let s = 1; s < SWEEP_SECONDS; s += 1) {
    const x = padLeft + (s / SWEEP_SECONDS) * plotW
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, cssHeight)
    ctx.stroke()
  }

  // Horizontal gridlines + scale labels
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const tick of niceTicks(trace.min, trace.max)) {
    const y = yFor(tick)
    const isZero = tick === 0
    ctx.strokeStyle = isZero ? colors.zero : colors.grid
    ctx.beginPath()
    ctx.moveTo(padLeft, y)
    ctx.lineTo(cssWidth, y)
    ctx.stroke()
    ctx.fillStyle = colors.axis
    ctx.fillText(String(tick), padLeft - 6, Math.min(Math.max(y, 7), cssHeight - 7))
  }

  if (data.length < 2) return

  const xFor = (i) => padLeft + (i / (data.length - 1)) * plotW
  const baselineY = yFor(Math.max(trace.min, 0))

  // Gradient fill under the trace
  const fill = ctx.createLinearGradient(0, 0, 0, cssHeight)
  fill.addColorStop(0, withAlpha(colors.trace, 0.22))
  fill.addColorStop(1, withAlpha(colors.trace, 0))
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(xFor(0), baselineY)
  data.forEach((sample, i) => ctx.lineTo(xFor(i), yFor(sample[trace.key])))
  ctx.lineTo(xFor(data.length - 1), baselineY)
  ctx.closePath()
  ctx.fill()

  // The trace itself, with a soft glow
  ctx.beginPath()
  data.forEach((sample, i) => {
    const x = xFor(i)
    const y = yFor(sample[trace.key])
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

  if (cursorIndex == null) {
    // Leading-edge marker follows the newest sample while sweeping.
    const lastX = xFor(data.length - 1)
    const lastY = yFor(data[data.length - 1][trace.key])
    ctx.fillStyle = colors.trace
    ctx.beginPath()
    ctx.arc(lastX, lastY, 2.6, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  // Frozen: draw a measurement cursor at the inspected sample instead.
  const i = Math.min(Math.max(cursorIndex, 0), data.length - 1)
  const cx = xFor(i)
  const cy = yFor(data[i][trace.key])
  ctx.strokeStyle = colors.axis
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(cx, 0)
  ctx.lineTo(cx, cssHeight)
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
}

function TraceCanvas({ data, trace, cursorIndex, onScrub }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    draw(canvas, data, trace, cursorIndex)

    const observer = new ResizeObserver(() => draw(canvas, data, trace, cursorIndex))
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [data, trace, cursorIndex])

  // While frozen, clicking or dragging on a trace moves the shared cursor.
  const handlePointer = (e) => {
    if (!onScrub) return
    const rect = e.currentTarget.getBoundingClientRect()
    const padLeft = 34
    const plotW = rect.width - padLeft
    const frac = (e.clientX - rect.left - padLeft) / plotW
    onScrub(Math.round(Math.min(Math.max(frac, 0), 1) * (data.length - 1)))
  }

  const value = cursorIndex != null && data.length
    ? data[Math.min(Math.max(cursorIndex, 0), data.length - 1)][trace.key]
    : null

  return (
    <div className="trace-row">
      <div className="trace-legend">
        <span className="trace-dot" style={{ background: `var(${trace.token})` }} />
        <span className="trace-name">{trace.label}</span>
        <span className="trace-unit">{trace.unit}</span>
        {value != null && (
          <span className="trace-cursor-value tnum" style={{ color: `var(${trace.token})` }}>
            {value.toFixed(1)}
          </span>
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
  waveform, frozen, onToggleFreeze, cursorIndex, onCursorChange,
}) {
  const cursorTime = cursorIndex != null && waveform.length > 1
    ? ((cursorIndex / (waveform.length - 1)) * SWEEP_SECONDS - SWEEP_SECONDS).toFixed(2)
    : null

  return (
    <div className={frozen ? 'waveform-display panel is-frozen' : 'waveform-display panel'}>
      <div className="waveform-header">
        <span className="panel-title">Waveforms</span>
        <div className="waveform-tools">
          {frozen && cursorTime != null && (
            <span className="cursor-time tnum">{cursorTime}s</span>
          )}
          <span className="waveform-scale">{SWEEP_SECONDS}s sweep</span>
          <button
            type="button"
            className={frozen ? 'btn btn-ghost btn-tiny freeze-active' : 'btn btn-ghost btn-tiny'}
            onClick={onToggleFreeze}
          >
            {frozen ? 'Resume' : 'Freeze'}
          </button>
        </div>
      </div>
      {frozen && (
        <p className="freeze-hint">Frozen — click or drag across a trace to inspect a point.</p>
      )}
      {TRACES.map((trace) => (
        <TraceCanvas
          key={trace.key}
          data={waveform}
          trace={trace}
          cursorIndex={frozen ? cursorIndex : null}
          onScrub={frozen ? onCursorChange : null}
        />
      ))}
    </div>
  )
}
