import { useEffect, useRef } from 'react'

const TRACES = [
  { key: 'pressure', label: 'Paw', unit: 'cmH₂O', color: '#4cc4f5', min: -5, max: 45 },
  { key: 'flow', label: 'Flow', unit: 'L/min', color: '#5fe08f', min: -80, max: 80 },
  { key: 'volume', label: 'Volume', unit: 'mL', color: '#f5c85c', min: 0, max: 800 },
]

const SWEEP_SECONDS = 10

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

  const padLeft = 34
  const plotW = cssWidth - padLeft
  const yFor = (v) => {
    const clamped = Math.min(Math.max(v, trace.min), trace.max)
    return cssHeight - ((clamped - trace.min) / (trace.max - trace.min)) * cssHeight
  }

  // Vertical time gridlines, one per second
  ctx.strokeStyle = 'rgba(255,255,255,0.045)'
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
    ctx.strokeStyle = isZero ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.055)'
    ctx.beginPath()
    ctx.moveTo(padLeft, y)
    ctx.lineTo(cssWidth, y)
    ctx.stroke()
    ctx.fillStyle = isZero ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.28)'
    ctx.fillText(String(tick), padLeft - 6, Math.min(Math.max(y, 7), cssHeight - 7))
  }

  if (data.length < 2) return

  const xFor = (i) => padLeft + (i / (data.length - 1)) * plotW
  const baselineY = yFor(Math.max(trace.min, 0))

  // Gradient fill under the trace
  const fill = ctx.createLinearGradient(0, 0, 0, cssHeight)
  fill.addColorStop(0, `${trace.color}38`)
  fill.addColorStop(1, `${trace.color}00`)
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
  ctx.strokeStyle = trace.color
  ctx.lineWidth = 1.9
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = trace.color
  ctx.shadowBlur = 9
  ctx.stroke()
  ctx.shadowBlur = 0

  // Leading-edge marker
  const lastX = xFor(data.length - 1)
  const lastY = yFor(data[data.length - 1][trace.key])
  ctx.fillStyle = trace.color
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
        <span className="trace-dot" style={{ background: trace.color, boxShadow: `0 0 10px ${trace.color}` }} />
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
