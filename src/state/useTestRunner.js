import { useCallback, useEffect, useRef, useState } from 'react'
import { STEP_STATUS, initialStepStates } from '../engine/selfTests.js'

const STEP_DURATION_MS = 420

// Walks a test suite one step at a time, marking each step running and then
// passed. Results are simulated — nothing is measured.
export function useTestRunner(suite, { onComplete } = {}) {
  const [steps, setSteps] = useState(() => initialStepStates(suite))
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    setSteps(initialStepStates(suite))
    setRunning(false)
    setFinished(false)
  }, [suite])

  useEffect(() => reset(), [reset])

  const start = useCallback(() => {
    setSteps(initialStepStates(suite))
    setFinished(false)
    setRunning(true)
  }, [suite])

  useEffect(() => {
    if (!running) return undefined

    const nextIndex = steps.findIndex((s) => s.status === STEP_STATUS.PENDING
      || s.status === STEP_STATUS.RUNNING)

    if (nextIndex === -1) {
      setRunning(false)
      setFinished(true)
      onCompleteRef.current?.()
      return undefined
    }

    const current = steps[nextIndex]
    if (current.status === STEP_STATUS.PENDING) {
      setSteps((prev) => prev.map((s, i) => (
        i === nextIndex ? { ...s, status: STEP_STATUS.RUNNING } : s
      )))
      return undefined
    }

    timerRef.current = setTimeout(() => {
      setSteps((prev) => prev.map((s, i) => (
        i === nextIndex ? { ...s, status: STEP_STATUS.PASSED } : s
      )))
    }, STEP_DURATION_MS)

    return () => clearTimeout(timerRef.current)
  }, [running, steps])

  const progress = steps.filter((s) => s.status === STEP_STATUS.PASSED).length / steps.length

  return { steps, running, finished, progress, start, reset }
}
