import { useMemo } from 'react'

// Anatomical lung illustration driven by the simulation.
//
// The airway tree and lobar divisions follow real anatomy — three lobes on
// the right, two on the left, with the cardiac notch on the left — because
// a schematic pair of matching sacs would teach the wrong shape.
//
// Motion is driven by delivered volume rather than by a fixed animation, so
// what is drawn is what the model says the lung is doing: the lungs expand
// with volume, the diaphragm descends as they fill, and colour follows
// saturation from a well-oxygenated pink toward a dusky tone.

const VIEWBOX = { w: 260, h: 300 }

// Expansion is scaled against a nominal adult tidal volume so the movement
// is legible without exaggerating small volumes into large excursions.
const NOMINAL_VT = 500
const MAX_SCALE = 0.10

function lerp(a, b, x) {
  return a + (b - a) * Math.min(Math.max(x, 0), 1)
}

// Saturation drives the tint: pink when well oxygenated, dusky when not.
// The threshold is a display choice, not a clinical one.
function tintFor(spo2) {
  if (spo2 == null) return { fill: '#8b6f7d', stroke: '#a4839', label: null }
  const x = Math.min(Math.max((spo2 - 80) / 18, 0), 1)
  const r = Math.round(lerp(120, 232, x))
  const g = Math.round(lerp(96, 150, x))
  const b = Math.round(lerp(128, 160, x))
  return {
    fill: `rgb(${r}, ${g}, ${b})`,
    stroke: `rgb(${Math.round(r * 0.78)}, ${Math.round(g * 0.72)}, ${Math.round(b * 0.78)})`,
  }
}

export default function LungIllustration({
  volume = 0, tidalVolume = NOMINAL_VT, spo2 = null, compliance = 50, phase,
}) {
  const fill = Math.min(Math.max(volume / Math.max(tidalVolume, 1), 0), 1.15)
  const scale = 1 + fill * MAX_SCALE
  const tint = useMemo(() => tintFor(spo2), [spo2])

  // A stiffer lung expands less for the same delivered volume, so the
  // illustration shows reduced excursion rather than only a different number.
  const complianceFactor = Math.min(Math.max(compliance / 50, 0.45), 1.15)
  const effectiveScale = 1 + (scale - 1) * complianceFactor

  // The diaphragm descends as the lungs fill.
  const diaphragmDrop = fill * 10 * complianceFactor
  const inspiring = phase != null && String(phase).startsWith('inspiration')

  return (
    <div className="lung-illustration">
      <svg
        viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
        role="img"
        aria-label={`Simulated lung, ${Math.round(volume)} millilitres above baseline`}
      >
        <defs>
          <radialGradient id="lungTissue" cx="50%" cy="38%" r="68%">
            <stop offset="0%" stopColor={tint.fill} stopOpacity="0.95" />
            <stop offset="100%" stopColor={tint.stroke} stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id="airwayMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8dee9" />
            <stop offset="100%" stopColor="#9aa4b2" />
          </linearGradient>
          <filter id="lungGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ribcage, drawn behind the lungs for depth */}
        <g className="ribcage" opacity="0.16" stroke="currentColor" fill="none" strokeWidth="2">
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M 42 ${86 + i * 26} Q 130 ${64 + i * 26} 218 ${86 + i * 26}`}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Airway: trachea, carina, main bronchi */}
        <g fill="url(#airwayMetal)" stroke="#78828f" strokeWidth="1">
          <path d="M 122 18 L 138 18 L 138 84 L 122 84 Z" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="121" y={24 + i * 10} width="18" height="3.4" rx="1.7" opacity="0.55" />
          ))}
          {/* Right main bronchus is wider and more vertical than the left,
              which is why aspirated material tends to enter it. */}
          <path d="M 128 82 Q 112 96 100 116 L 110 122 Q 122 102 134 90 Z" />
          <path d="M 134 82 Q 152 94 164 110 L 155 117 Q 143 100 130 90 Z" />
        </g>

        <g
          className={inspiring ? 'lung-body inspiring' : 'lung-body'}
          style={{ transformOrigin: '130px 120px', transform: `scale(${effectiveScale.toFixed(4)})` }}
          filter="url(#lungGlow)"
        >
          {/* Right lung: three lobes */}
          <path
            className="lung-lobe"
            d="M 112 96
               C 86 104, 62 130, 56 168
               C 50 206, 60 240, 78 254
               C 94 266, 112 260, 116 240
               C 121 214, 120 150, 118 118
               Z"
            fill="url(#lungTissue)"
            stroke={tint.stroke}
            strokeWidth="1.6"
          />
          <path d="M 60 148 C 82 142, 104 140, 117 142" fill="none" stroke={tint.stroke} strokeWidth="1.2" opacity="0.75" />
          <path d="M 58 196 C 80 190, 104 188, 117 190" fill="none" stroke={tint.stroke} strokeWidth="1.2" opacity="0.75" />

          {/* Left lung: two lobes, with the cardiac notch */}
          <path
            className="lung-lobe"
            d="M 148 96
               C 174 104, 198 130, 204 168
               C 210 206, 200 240, 182 254
               C 166 266, 148 260, 144 240
               C 141 222, 142 206, 150 196
               C 158 186, 158 176, 148 168
               C 140 160, 142 130, 146 118
               Z"
            fill="url(#lungTissue)"
            stroke={tint.stroke}
            strokeWidth="1.6"
          />
          <path d="M 200 160 C 180 154, 158 152, 146 154" fill="none" stroke={tint.stroke} strokeWidth="1.2" opacity="0.75" />
        </g>

        {/* Diaphragm descends as the lungs fill */}
        <path
          className="diaphragm"
          d={`M 46 ${262 + diaphragmDrop}
              Q 130 ${292 + diaphragmDrop * 1.5} 214 ${262 + diaphragmDrop}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.28"
        />
      </svg>

      <div className="lung-readout">
        <span className="lung-volume tnum">{Math.round(volume)}</span>
        <span className="lung-volume-unit">mL above baseline</span>
      </div>
    </div>
  )
}
