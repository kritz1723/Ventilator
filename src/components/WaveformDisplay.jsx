import { useEffect, useRef } from 'react'

const TRACES = [
  { key: 'pressure', label: 'Paw', unit: 'cmH2O', color: '#5ec8f2', min: -5, max: 45 },
  { key: 'flow', label: 'Flow', unit: 'L/min', color: '#7be08b', min: -80, max: 80 },
  { key: 'volume', label: 'Volume', unit: 'mL', color: '#f2c94c', min: 0, max: 800 },
]

function drawTrace(canvas, data, trace) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  // zero / baseline gridline
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  const zeroY = height - ((0 - trace.min) / (trace.max - trace.min)) * height
  ctx.beginPath()
  ctx.moveTo(0, zeroY)
  ctx.lineTo(width, zeroY)
  ctx.stroke()

  if (!data.length) return

  ctx.strokeStyle = trace.color
  ctx.lineWidth = 2
  ctx.beginPath()
  data.forEach((sample, i) => {
    const value = sample[trace.key]
    const x = (i / (data.length - 1)) * width
    const clamped = Math.min(Math.max(value, trace.min), trace.max)
    const y = height - ((clamped - trace.min) / (trace.max - trace.min)) * height
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
}

function TraceCanvas({ data, trace }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawTrace(canvas, data, trace)
  }, [data, trace])

  return (
    <div className="trace-row">
      <div className="trace-label">
        <span>{trace.label}</span>
        <span className="trace-unit">{trace.unit}</span>
      </div>
      <canvas ref={canvasRef} width={900} height={110} className="trace-canvas" />
    </div>
  )
}

export default function WaveformDisplay({ waveform }) {
  return (
    <div className="waveform-display">
      {TRACES.map((trace) => (
        <TraceCanvas key={trace.key} data={waveform} trace={trace} />
      ))}
    </div>
  )
}
