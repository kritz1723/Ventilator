import { useEffect, useRef } from 'react'

const TRACES = [
  { key: 'pressure', label: 'Paw', unit: 'cmH₂O', token: '--paw', min: -5, max: 45 },
  { key: 'flow', label: 'Flow', unit: 'L/min', token: '--flow', min: -80, max: 80 },
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

function draw(canvas, data, trace) {
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

  // Leading-edge marker
  const lastX = xFor(data.length - 1)
  const lastY = yFor(data[data.length - 1][trace.key])
  ctx.fillStyle = colors.trace
  ctx.beginPath()
  ctx.arc(lastX, lastY, 2.6, 0, Math.PI * 2)
  ctx.fill()
}

function TraceCanvas({ data, trace }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    draw(canvas, data, trace)

    const observer = new ResizeObserver(() => draw(canvas, data, trace))
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [data, trace])

  return (
    <div className="trace-row">
      <div className="trace-legend">
        <span className="trace-dot" style={{ background: `var(${trace.token})` }} />
        <span className="trace-name">{trace.label}</span>
        <span className="trace-unit">{trace.unit}</span>
      </div>
      <canvas ref={canvasRef} className="trace-canvas" />
    </div>
  )
}

export default function WaveformDisplay({ waveform }) {
  return (
    <div className="waveform-display panel">
      <div className="waveform-header">
        <span className="panel-title">Waveforms</span>
        <span className="waveform-scale">{SWEEP_SECONDS}s sweep</span>
      </div>
      {TRACES.map((trace) => (
        <TraceCanvas key={trace.key} data={waveform} trace={trace} />
      ))}
    </div>
  )
}
