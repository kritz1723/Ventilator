import { useState } from 'react'
import { MODES } from '../engine/ventilatorModes/index.js'
import { rangeFor, COMMON_RANGES } from '../engine/patientCategories.js'
import { getBreathTiming } from '../engine/ventilatorModes/breathTiming.js'

// The primary settings sit along the bottom edge as large touch targets, the
// row a hand reaches for without looking up from the patient. Selecting a
// tile opens its adjustment in place rather than in a dialogue, so the value
// stays visible while it is being changed.
export default function SettingTiles({
  settings, patientCategory, onChange, disabled, pendingKeys = [],
}) {
  const [openKey, setOpenKey] = useState(null)
  const mode = MODES[settings.mode]
  const { ti, te } = getBreathTiming(settings)

  const vt = rangeFor(patientCategory, 'tidalVolume')
  const rr = rangeFor(patientCategory, 'respRate')
  const pi = rangeFor(patientCategory, 'pInsp')
  const peep = rangeFor(patientCategory, 'peep')

  const tiles = [
    { key: 'fio2', label: 'FiO₂', unit: '%', value: settings.fio2, range: COMMON_RANGES.fio2 },
    mode?.primaryControl === 'pInsp'
      ? { key: 'pInsp', label: 'P insp', unit: 'cmH₂O', value: settings.pInsp, range: pi }
      : { key: 'tidalVolume', label: 'Vt', unit: 'mL', value: settings.tidalVolume, range: vt },
    { key: 'respRate', label: 'Rate', unit: 'bpm', value: settings.respRate, range: rr },
    { key: 'peep', label: 'PEEP', unit: 'cmH₂O', value: settings.peep, range: peep },
    { key: 'pauseTime', label: 'Insp. pause', unit: 's', value: settings.pauseTime, range: { min: 0, max: 1, step: 0.1 } },
  ]

  const step = (tile, direction) => {
    if (disabled) return
    const next = Number(
      Math.min(Math.max(tile.value + direction * tile.range.step, tile.range.min), tile.range.max)
        .toFixed(2),
    )
    onChange({ ...settings, [tile.key]: next })
  }

  return (
    <div className={disabled ? 'setting-tiles is-disabled' : 'setting-tiles'}>
      {tiles.map((tile) => {
        const open = openKey === tile.key
        const pending = pendingKeys.includes(tile.key)
        return (
          <div key={tile.key} className={`setting-tile${open ? ' open' : ''}${pending ? ' pending' : ''}`}>
            <button
              type="button"
              className="setting-face"
              disabled={disabled}
              onClick={() => setOpenKey(open ? null : tile.key)}
            >
              <span className="setting-label">{tile.label}</span>
              <span className="setting-value tnum">{tile.value}</span>
              <span className="setting-unit">{tile.unit}</span>
            </button>

            {open && !disabled && (
              <div className="setting-adjust">
                <button type="button" aria-label={`Decrease ${tile.label}`} onClick={() => step(tile, -1)}>−</button>
                <span className="setting-range tnum">{tile.range.min}–{tile.range.max}</span>
                <button type="button" aria-label={`Increase ${tile.label}`} onClick={() => step(tile, 1)}>+</button>
              </div>
            )}
          </div>
        )
      })}

      {/* Derived timing, shown alongside the settings that produce it so the
          consequence of a rate or ratio change is visible immediately. */}
      <div className="setting-tile setting-derived">
        <span className="setting-label">I:E</span>
        <span className="setting-value tnum">1:{(settings.ieRatio[1] / settings.ieRatio[0]).toFixed(1)}</span>
        <span className="setting-derived-sub tnum">
          Ti {ti.toFixed(2)}s · Te {te.toFixed(2)}s
        </span>
      </div>
    </div>
  )
}
