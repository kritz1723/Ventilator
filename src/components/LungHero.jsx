import LungIllustration from './LungIllustration.jsx'

// The hero panel puts the breath itself at the centre of the screen, with the
// two halves of the cycle drawn as arcs around it. The arc for the phase in
// progress is the lit one, so the direction of gas movement is readable
// without parsing a waveform — which is the point of having a picture at all.
export default function LungHero({
  live, settings, patient, spo2, numerics, holdState, frozen, onToggleFreeze, t,
}) {
  const phase = live?.phase ?? null
  const inspiring = phase != null && String(phase).startsWith('inspiration')
  const holding = Boolean(holdState?.active)

  const arcState = (which) => {
    if (holding) return 'held'
    if (which === 'insp') return inspiring ? 'active' : 'idle'
    return inspiring ? 'idle' : 'active'
  }

  return (
    <section className="lung-hero panel">
      <div className="hero-arcs">
        <svg viewBox="0 0 420 380" aria-hidden="true">
          <defs>
            <linearGradient id="inspArc" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="expArc" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--text-muted)" stopOpacity="0.15" />
            </linearGradient>
            <marker id="arrowIn" viewBox="0 0 10 10" refX="5" refY="5"
              markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13"
              orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="arrowOut" viewBox="0 0 10 10" refX="5" refY="5"
              markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13"
              orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
            </marker>
          </defs>

          {/* Inspiration sweeps down the left, expiration back up the right */}
          <path
            className={`arc arc-insp is-${arcState('insp')}`}
            d="M 196 58 A 150 150 0 0 0 78 268"
            fill="none"
            stroke="url(#inspArc)"
            strokeWidth="5"
            strokeLinecap="round"
            markerEnd="url(#arrowIn)"
          />
          <path
            className={`arc arc-exp is-${arcState('exp')}`}
            d="M 224 58 A 150 150 0 0 1 342 268"
            fill="none"
            stroke="url(#expArc)"
            strokeWidth="5"
            strokeLinecap="round"
            markerEnd="url(#arrowOut)"
          />
          {/* The PEEP baseline closes the loop: expiration returns here, not
              to zero, which is the whole idea of a positive end-expiratory
              pressure. */}
          <path
            className="arc arc-baseline"
            d="M 78 268 A 150 150 0 0 0 342 268"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="2"
            strokeDasharray="3 6"
          />
        </svg>

        <div className="hero-label hero-label-insp">
          <span className="hero-label-title">Inspiration</span>
          <span className="hero-label-sub">
            {settings.mode === 'VC-CMV' || settings.mode === 'VC-SIMV'
              ? `Vt ${settings.tidalVolume} mL set`
              : `P insp ${settings.pInsp} cmH₂O`}
          </span>
        </div>

        <div className="hero-label hero-label-exp">
          <span className="hero-label-title">Expiration</span>
          <span className="hero-label-sub">
            Vte {numerics?.tidalVolumeExhaled != null
              ? Math.round(numerics.tidalVolumeExhaled)
              : '––'} mL
          </span>
        </div>

        <div className="hero-label hero-label-peep">
          <span className="hero-label-title">PEEP {settings.peep} cmH₂O</span>
          <span className="hero-label-sub">Baseline pressure</span>
        </div>

        <div className="hero-lung">
          <LungIllustration
            volume={live?.volume ?? 0}
            tidalVolume={settings.tidalVolume}
            spo2={spo2}
            compliance={patient.compliance}
            phase={phase}
          />
        </div>
      </div>

      <div className="hero-footer">
        <button
          type="button"
          className={frozen ? 'hero-freeze active' : 'hero-freeze'}
          onClick={onToggleFreeze}
          aria-pressed={frozen}
        >
          {frozen ? '▶' : '❚❚'}
          <span>{frozen ? t('action.resume') : t('action.freeze')}</span>
        </button>

        <span className="hero-phase">
          {holding
            ? `${holdState.active === 'inspHold' ? 'Inspiratory' : 'Expiratory'} hold — ${Math.ceil(holdState.remaining ?? 0)}s`
            : inspiring ? 'Inspiratory phase' : 'Expiratory phase'}
        </span>

        <span className="hero-patient">{patient.label}</span>
      </div>
    </section>
  )
}
