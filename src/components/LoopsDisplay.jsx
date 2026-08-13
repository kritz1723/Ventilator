import { useEffect, useRef } from 'react'

const LOOPS = [
  {
    id: 'pv',
    title: 'Pressure — Volume',
    xKey: 'pressure', yKey: 'volume',
    xLabel: 'Paw (cmH₂O)', yLabel: 'V (mL)',
    xMin: 0, xMax: 45, yMin: 0, yMax: 800,
    token: '--paw',
  },
  {
    id: 'fv',
    title: 'Flow — Volume',
    xKey: 'volume', yKey: 'flow',
    xLabel: 'V (mL)', yLabel: 'Flow (L/min)',
    xMin: 0, xMax: 800, yMin: -150, yMax: 150,
    token: '--flow',
  },
]

function drawLoop(canvas, data, cfg) {
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

  const cs = getComputedStyle(canvas)
  const traceColor = cs.getPropertyValue(cfg.token).trim() || '#4cc4f5'
  const gridZero = cs.getPropertyValue('--grid-zero').trim() || 'rgba(255,255,255,0.2)'
  const axisText = cs.getPropertyValue('--axis-text').trim() || 'rgba(255,255,255,0.3)'

  const pad = { l: 30, r: 8, t: 8, b: 20 }
  const plotW = w - pad.l - pad.r
  const plotH = h - pad.t - pad.b

  const xFor = (v) => pad.l + ((Math.min(Math.max(v, cfg.xMin), cfg.xMax) - cfg.xMin) / (cfg.xMax - cfg.xMin)) * plotW
  const yFor = (v) => pad.t + plotH - ((Math.min(Math.max(v, cfg.yMin), cfg.yMax) - cfg.yMin) / (cfg.yMax - cfg.yMin)) * plotH

  // Axes
  ctx.strokeStyle = gridZero
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad.l, pad.t)
  ctx.lineTo(pad.l, pad.t + plotH)
  ctx.lineTo(pad.l + plotW, pad.t + plotH)
  ctx.stroke()

  if (cfg.yMin < 0) {
    const zeroY = yFor(0)
    ctx.strokeStyle = gridZero
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(pad.l, zeroY)
    ctx.lineTo(pad.l + plotW, zeroY)
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.fillStyle = axisText
  ctx.font = '9px ui-monospace, Menlo, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(cfg.xLabel, pad.l + plotW / 2, h - 5)
  ctx.save()
  ctx.translate(9, pad.t + plotH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(cfg.yLabel, 0, 0)
  ctx.restore()

  if (data.length < 2) return

  ctx.beginPath()
  data.forEach((s, i) => {
    const x = xFor(s[cfg.xKey])
    const y = yFor(s[cfg.yKey])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = traceColor
  ctx.lineWidth = 1.5
  ctx.shadowColor = traceColor
  ctx.shadowBlur = 7
  ctx.stroke()
  ctx.shadowBlur = 0
}

function LoopCanvas({ data, cfg }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    drawLoop(canvas, data, cfg)
    const ro = new ResizeObserver(() => drawLoop(canvas, data, cfg))
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [data, cfg])

  return (
    <div className="loop-cell">
      <span className="loop-title">{cfg.title}</span>
      <canvas ref={ref} className="loop-canvas" />
    </div>
  )
}

export default function LoopsDisplay({ loop }) {
  return (
    <div className="loops-display panel">
      <div className="panel-header loops-header">
        <span className="panel-title">Loops</span>
        <span className="loops-hint">Last complete breath</span>
      </div>
      <div className="loops-grid">
        {LOOPS.map((cfg) => <LoopCanvas key={cfg.id} data={loop} cfg={cfg} />)}
      </div>
    </div>
  )
}
