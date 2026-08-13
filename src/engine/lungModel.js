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

// Airway opening pressure while the ventilator is driving gas in. The
// resistive term is positive because flow is inward, so the measured
// pressure sits above the alveolar pressure by that drop.
export function computeAirwayPressure({ volume, flow, peep, compliance, resistance }) {
  const flowLps = flow / 60
  return peep + volume / compliance + flowLps * resistance
}

// Alveolar pressure — the elastic recoil of the gas held above the PEEP
// baseline. This is what a hold maneuver equilibrates the airway to.
export function alveolarPressure({ volume, peep, compliance }) {
  return peep + volume / compliance
}

// Resistance of the expiratory limb and valve (cmH2O/L/s), separate from
// the patient's own airway resistance.
export const EXPIRATORY_CIRCUIT_RESISTANCE = 3

// Airway opening pressure during passive expiration.
//
// The equation of motion describes alveolar pressure, but the expiratory
// valve regulates the airway opening to PEEP, so that is not what a sensor
// at the Y-piece reads. The patient's airway resistance sits between the
// alveolus and the sensor, so the alveolar recoil is not transmitted to it.
// What the sensor does see is PEEP plus the resistive drop of the outgoing
// flow across the expiratory limb — which is why airway pressure decays
// toward PEEP from above and never falls below it.
export function expiratoryAirwayPressure({ flow, peep, circuitResistance = EXPIRATORY_CIRCUIT_RESISTANCE }) {
  const flowLps = Math.abs(flow) / 60
  return peep + flowLps * circuitResistance
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
  // Volumes are held in mL, so convert the delta to litres before turning
  // it into a flow rate; flow is reported in L/min and is negative because
  // gas is leaving the lung.
  const avgFlowLps = -((volume - newVolume) / 1000) / dt
  return { volume: newVolume, flow: avgFlowLps * 60 }
}

// Forced inflation toward a target airway pressure (used by Pressure
// Control): flow is derived by rearranging the equation of motion.
export function pressureTargetStep({ volume, peep, targetPressure, compliance, resistance, dt }) {
  const flowLps = (targetPressure - peep - volume / compliance) / resistance
  const newVolume = Math.max(volume + flowLps * dt * 1000, 0)
  return { volume: newVolume, flow: flowLps * 60 }
}
