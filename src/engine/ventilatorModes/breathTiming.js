// Shared breath-timing helper used by every mode: derives inspiratory and
// expiratory phase durations from respiratory rate and I:E ratio.

export function getBreathTiming({ respRate, ieRatio }) {
  const cycleTime = 60 / respRate
  const [iPart, ePart] = ieRatio
  const ti = cycleTime * (iPart / (iPart + ePart))
  const te = cycleTime - ti
  return { cycleTime, ti, te }
}
