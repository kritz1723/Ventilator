// Derived respiratory mechanics computed from the breath the simulator has
// just delivered. These are the standard bedside relationships; because the
// underlying model is a single compartment, they recover the compliance and
// resistance that were dialled in rather than revealing anything new — which
// is exactly what makes them useful for teaching what each number means.

export function staticCompliance({ tidalVolume, plateauPressure, peep }) {
  const driving = plateauPressure - peep
  return driving > 0 ? tidalVolume / driving : null
}

export function dynamicCompliance({ tidalVolume, peakPressure, peep }) {
  const driving = peakPressure - peep
  return driving > 0 ? tidalVolume / driving : null
}

export function inspiratoryResistance({ peakPressure, plateauPressure, peakFlow }) {
  const flowLps = peakFlow / 60
  return flowLps > 0 ? (peakPressure - plateauPressure) / flowLps : null
}

export function drivingPressure({ plateauPressure, peep }) {
  return plateauPressure - peep
}

// Time constant of the respiratory system (s). Roughly 3 time constants are
// needed for ~95% of the delivered volume to be exhaled.
export function timeConstant({ compliance, resistance }) {
  return (compliance / 1000) * resistance
}

// Rapid shallow breathing index — frequency divided by tidal volume in
// litres. Conventionally used as a weaning predictor.
export function rapidShallowBreathingIndex({ respRate, tidalVolume }) {
  const litres = tidalVolume / 1000
  return litres > 0 ? respRate / litres : null
}

// Mechanical power delivered to the respiratory system (J/min), using the
// simplified form commonly quoted for volume-controlled ventilation.
export function mechanicalPower({ respRate, tidalVolume, peakPressure, plateauPressure, peep }) {
  const vtL = tidalVolume / 1000
  const elastic = 0.5 * vtL * (plateauPressure - peep)
  const resistive = vtL * (peakPressure - plateauPressure)
  const peepWork = vtL * peep
  return 0.098 * respRate * (elastic + resistive + peepWork)
}

export function computeMeasurements({
  tidalVolume,
  peakPressure,
  plateauPressure,
  peep,
  peakFlow,
  respRate,
  compliance,
  resistance,
  ti,
  te,
}) {
  return {
    cstat: staticCompliance({ tidalVolume, plateauPressure, peep }),
    cdyn: dynamicCompliance({ tidalVolume, peakPressure, peep }),
    rinsp: inspiratoryResistance({ peakPressure, plateauPressure, peakFlow }),
    drivingPressure: drivingPressure({ plateauPressure, peep }),
    timeConstant: timeConstant({ compliance, resistance }),
    rsbi: rapidShallowBreathingIndex({ respRate, tidalVolume }),
    mechanicalPower: mechanicalPower({
      respRate, tidalVolume, peakPressure, plateauPressure, peep,
    }),
    ti,
    te,
    ieRatio: te > 0 ? ti / te : null,
  }
}
