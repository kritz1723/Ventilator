import { useEffect } from 'react'
import { useTestRunner } from '../state/useTestRunner.js'
import { STEP_STATUS, LEAK_TEST_RESULTS } from '../engine/selfTests.js'

function StepIcon({ status }) {
  if (status === STEP_STATUS.PASSED) return <span className="step-icon step-passed">✓</span>
  if (status === STEP_STATUS.FAILED) return <span className="step-icon step-failed">✕</span>
  if (status === STEP_STATUS.RUNNING) return <span className="step-icon step-running" />
  return <span className="step-icon step-pending" />
}

export default function TestPanel({ suite, onComplete, onClose, autoStart = false }) {
  const { steps, running, finished, progress, start } = useTestRunner(suite, { onComplete })

  useEffect(() => {
    if (autoStart) start()
  }, [autoStart, start])

  return (
    <div className="test-panel panel">
      <div className="test-header">
        <div>
          <h2>{suite.name}</h2>
          <p>{suite.description}</p>
        </div>
        {onClose && !running && (
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        )}
      </div>

      <div className="test-progress">
        <div className="test-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <ol className="test-steps">
        {steps.map((step) => (
          <li key={step.id} className={`test-step test-step-${step.status}`}>
            <StepIcon status={step.status} />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>

      {finished && suite.id === 'leak' && (
        <div className="test-results">
          {LEAK_TEST_RESULTS.map((r) => (
            <div key={r.label} className="test-result">
              <span className="test-result-label">{r.label}</span>
              <span className="test-result-value tnum">{r.value} <em>{r.unit}</em></span>
              <span className="test-result-limit">{r.limit}</span>
            </div>
          ))}
        </div>
      )}

      <div className="test-footer">
        {finished ? (
          <span className="test-verdict test-verdict-pass">All checks passed (simulated)</span>
        ) : (
          <span className="test-verdict">{running ? 'Running…' : 'Ready'}</span>
        )}
        {!running && !autoStart && (
          <button type="button" className="btn btn-run" onClick={start}>
            {finished ? 'Run again' : 'Start test'}
          </button>
        )}
      </div>
    </div>
  )
}
