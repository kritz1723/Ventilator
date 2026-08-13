import { describe, it, expect } from 'vitest'
import {
  pendingDiff, hasPendingChanges, clampToRanges, CONFIRMABLE, CONFIRMATION_COPY,
} from '../src/engine/pendingChanges.js'

const applied = {
  respRate: 14, tidalVolume: 450, pInsp: 15, peep: 5, fio2: 40,
  pauseTime: 0.3, triggerFlow: 2, flowPattern: 'square',
  alarmLimits: { highPressure: 40, lowPressure: 5 },
}

describe('pendingDiff', () => {
  it('reports nothing when the pending copy matches', () => {
    expect(pendingDiff(applied, { ...applied })).toHaveLength(0)
    expect(hasPendingChanges(applied, { ...applied })).toBe(false)
  })

  it('reports each changed setting with its old and new value', () => {
    const changes = pendingDiff(applied, { ...applied, peep: 8 })
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ key: 'peep', from: 5, to: 8, group: 'setting' })
  })

  it('reports alarm limit changes separately from settings', () => {
    const changes = pendingDiff(applied, {
      ...applied, alarmLimits: { ...applied.alarmLimits, highPressure: 45 },
    })
    expect(changes).toHaveLength(1)
    expect(changes[0].group).toBe('alarmLimit')
  })

  it('reports several changes at once', () => {
    const changes = pendingDiff(applied, { ...applied, peep: 8, fio2: 60 })
    expect(changes).toHaveLength(2)
  })

  it('treats a missing pending copy as no change', () => {
    expect(pendingDiff(applied, null)).toHaveLength(0)
  })
})

describe('clampToRanges', () => {
  it('brings values above the maximum into range', () => {
    const out = clampToRanges({ tidalVolume: 900 }, { tidalVolume: { min: 20, max: 350 } })
    expect(out.tidalVolume).toBe(350)
  })

  it('brings values below the minimum into range', () => {
    const out = clampToRanges({ tidalVolume: 5 }, { tidalVolume: { min: 20, max: 350 } })
    expect(out.tidalVolume).toBe(20)
  })

  it('leaves in-range values untouched', () => {
    const out = clampToRanges({ tidalVolume: 150 }, { tidalVolume: { min: 20, max: 350 } })
    expect(out.tidalVolume).toBe(150)
  })
})

describe('confirmation copy', () => {
  it('covers every confirmable transition', () => {
    for (const id of Object.values(CONFIRMABLE)) {
      expect(CONFIRMATION_COPY[id], id).toBeDefined()
      expect(CONFIRMATION_COPY[id].title).toBeTruthy()
      expect(CONFIRMATION_COPY[id].accept).toBeTruthy()
    }
  })
})
