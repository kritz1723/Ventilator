# ICU Ventilator Simulator

> **⚠️ SIMULATION ONLY — NOT A MEDICAL DEVICE — NOT FOR CLINICAL USE**
>
> This project is a software/UI simulation built for training, demo, and
> educational purposes. It is **not** a certified medical device, is **not**
> validated against any real ventilator's algorithms, and must **never** be
> used for clinical decision-making or connected to real patients or
> hardware. The physiological model and clinical numeric ranges shown are
> simplified teaching approximations, not authoritative reference values.

A browser-based mechanical ventilator simulator: adjustable ventilator
settings, a single-compartment lung model driving live pressure/flow/volume
waveforms, clinical numerics, and basic alarms — running entirely client-side.

## Features

- **Modes:** Volume Control (VC) and Pressure Control (PC), architected so
  additional modes (SIMV, PSV, ...) can be added without a rewrite.
- **Lung model:** single-compartment equation of motion,
  `P_aw = PEEP + V/C + Q·R`, with adjustable compliance (C) and resistance
  (R). Illustrative patient presets (Normal, ARDS, COPD, Fibrosis) let you
  see how altered lung mechanics change the waveforms.
- **Live waveforms:** airway pressure, flow, and volume vs. time.
- **Numerics:** peak pressure, plateau pressure, PEEP, exhaled tidal volume,
  minute volume, set/measured respiratory rate, FiO2.
- **Alarms:** high/low airway pressure and apnea detection, with
  user-adjustable limits.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm test          # run the lung-model / alarm unit tests
npm run build     # production build to dist/
```

## Project structure

```
src/
├── components/       # ControlPanel, WaveformDisplay, NumericsPanel, AlarmPanel, Disclaimer
├── engine/
│   ├── lungModel.js          # single-compartment equation of motion
│   ├── clock.js               # fixed-timestep simulation clock
│   ├── alarms.js              # alarm threshold evaluation
│   ├── patientPresets.js      # illustrative compliance/resistance presets
│   └── ventilatorModes/
│       ├── volumeControl.js
│       └── pressureControl.js
├── state/
│   ├── useVentilatorEngine.js # ties the clock + mode + lung model to React state
│   └── defaultSettings.js
└── App.jsx
tests/                # vitest unit tests for the engine math
```

## Deployment

Pushing to `main` builds the app and deploys it to GitHub Pages via
`.github/workflows/deploy.yml` (requires Pages to be enabled for this
repository, with the source set to "GitHub Actions").

## Disclaimer

See the banner above — repeated here because it matters: this tool is for
education and demonstration only. Do not use it, or any numbers it
produces, for real clinical decisions.
