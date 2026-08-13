// Single-compartment lung model.
//
// Equation of motion for the respiratory system:
//   P_aw = PEEP + V/C + Q*R
// where V is volume (mL) delivered above the PEEP baseline, C is
// respiratory system compliance (mL/cmH2O), Q is flow (L/min), and R is
// airway resistance (cmH2O/L/s).
//
// This is a simplified teaching model (no time-varying compliance, no
// spontaneous respiratory muscle effort) and is not clinically validated.

export function computeAirwayPressure({ volume, flow, peep, compliance, resistance }) {
  const flowLps = flow / 60
  return peep + volume / compliance + flowLps * resistance
}

// Passive exhalation follows first-order exponential decay toward the
// PEEP baseline, with time constant tau = R * C.
export function passiveExhaleStep({ volume, compliance, resistance, dt }) {
  const complianceL = compliance / 1000
  const tau = resistance * complianceL
  if (!(tau > 0) || volume <= 0) {
    return { volume: 0, flow: 0 }
  }
  const decay = Math.exp(-dt / tau)
  const newVolume = Math.max(volume * decay, 0)
  const avgFlowLps = -(volume - newVolume) / dt
  return { volume: newVolume, flow: avgFlowLps * 60 }
}

// Forced inflation toward a target airway pressure (used by Pressure
// Control): flow is derived by rearranging the equation of motion.
export function pressureTargetStep({ volume, peep, targetPressure, compliance, resistance, dt }) {
  const flowLps = (targetPressure - peep - volume / compliance) / resistance
  const newVolume = Math.max(volume + flowLps * dt * 1000, 0)
  return { volume: newVolume, flow: flowLps * 60 }
}
