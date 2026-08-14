import { describe, it, expect, vi } from 'vitest'
import { PRIORITY } from '../src/engine/alarms.js'
import {
  AUDIO_STATE, TONE_PATTERNS, stepToHz, patternFor, burstPulses, burstDurationMs,
  leadingAlarm, audioStateFor, shouldSound, pauseRemainingSeconds,
  pauseSurvives, requiresConfirmation,
} from '../src/engine/alarmTones.js'
import { AlarmAudio } from '../src/engine/alarmAudio.js'

const alarm = (priority, id = priority) => ({ id, priority })

describe('tone patterns', () => {
  it('describes a pattern for every priority', () => {
    for (const p of Object.values(PRIORITY)) {
      expect(patternFor(p), p).toBeTruthy()
    }
  })

  // Priority has to be audible without reading the screen, which it is only
  // if the patterns actually differ in the ways a listener can hear.
  it('gives higher priorities more pulses', () => {
    expect(burstPulses(PRIORITY.HIGH).length)
      .toBeGreaterThan(burstPulses(PRIORITY.MEDIUM).length)
    expect(burstPulses(PRIORITY.MEDIUM).length)
      .toBeGreaterThan(burstPulses(PRIORITY.LOW).length)
  })

  it('repeats higher priorities more often', () => {
    expect(TONE_PATTERNS[PRIORITY.HIGH].intervalMs)
      .toBeLessThan(TONE_PATTERNS[PRIORITY.MEDIUM].intervalMs)
    expect(TONE_PATTERNS[PRIORITY.MEDIUM].intervalMs)
      .toBeLessThan(TONE_PATTERNS[PRIORITY.LOW].intervalMs)
  })

  it('makes higher priorities louder', () => {
    expect(TONE_PATTERNS[PRIORITY.HIGH].gain)
      .toBeGreaterThan(TONE_PATTERNS[PRIORITY.LOW].gain)
  })

  it('orders the pulses of a burst in time', () => {
    for (const p of Object.values(PRIORITY)) {
      const offsets = burstPulses(p).map((x) => x.atMs)
      expect([...offsets].sort((a, b) => a - b), p).toEqual(offsets)
    }
  })

  // A burst that outlasts its own repeat interval would overlap itself.
  it('finishes each burst before it repeats', () => {
    for (const p of Object.values(PRIORITY)) {
      expect(burstDurationMs(p), p).toBeLessThan(TONE_PATTERNS[p].intervalMs)
    }
  })

  it('places pulses in the audible speech-adjacent band', () => {
    for (const p of Object.values(PRIORITY)) {
      for (const pulse of burstPulses(p)) {
        expect(pulse.frequency, p).toBeGreaterThan(150)
        expect(pulse.frequency, p).toBeLessThan(1000)
      }
    }
  })

  it('converts semitone steps to equal-tempered frequencies', () => {
    expect(stepToHz(440, 0)).toBeCloseTo(440)
    expect(stepToHz(440, 12)).toBeCloseTo(880)
    expect(stepToHz(440, 7)).toBeCloseTo(659.26, 1)
  })

  it('returns nothing for an unknown priority', () => {
    expect(patternFor('urgent')).toBeNull()
    expect(burstPulses('urgent')).toEqual([])
    expect(burstDurationMs('urgent')).toBe(0)
  })
})

describe('which alarm sounds', () => {
  // Annunciating several at once produces noise from which no priority can
  // be read.
  it('sounds the highest priority present', () => {
    const list = [alarm(PRIORITY.LOW), alarm(PRIORITY.HIGH), alarm(PRIORITY.MEDIUM)]
    expect(leadingAlarm(list).priority).toBe(PRIORITY.HIGH)
  })

  it('is stable when only one alarm is present', () => {
    expect(leadingAlarm([alarm(PRIORITY.MEDIUM)]).priority).toBe(PRIORITY.MEDIUM)
  })

  it('returns nothing for an empty list', () => {
    expect(leadingAlarm([])).toBeNull()
    expect(leadingAlarm(null)).toBeNull()
  })
})

describe('audio state', () => {
  const alarms = [alarm(PRIORITY.HIGH)]

  it('sounds when enabled, unpaused and alarming', () => {
    expect(audioStateFor({ enabled: true, alarms, now: 0 })).toBe(AUDIO_STATE.SOUNDING)
    expect(shouldSound({ enabled: true, alarms, now: 0 })).toBe(true)
  })

  it('is silent with no alarm', () => {
    expect(audioStateFor({ enabled: true, alarms: [], now: 0 })).toBe(AUDIO_STATE.SILENT)
  })

  it('is paused while the pause runs', () => {
    expect(audioStateFor({ enabled: true, pausedUntil: 5000, alarms, now: 1000 }))
      .toBe(AUDIO_STATE.PAUSED)
  })

  it('sounds again once the pause expires', () => {
    expect(audioStateFor({ enabled: true, pausedUntil: 5000, alarms, now: 5001 }))
      .toBe(AUDIO_STATE.SOUNDING)
  })

  // Off takes precedence over everything, including an alarm: it is a
  // decision about the device rather than about a condition.
  it('is off when disabled, whatever else is true', () => {
    expect(audioStateFor({ enabled: false, alarms, now: 0 })).toBe(AUDIO_STATE.OFF)
    expect(audioStateFor({ enabled: false, pausedUntil: 9e9, alarms, now: 0 })).toBe(AUDIO_STATE.OFF)
    expect(shouldSound({ enabled: false, alarms, now: 0 })).toBe(false)
  })

  it('counts the pause down and never below zero', () => {
    expect(pauseRemainingSeconds(10_000, 4000)).toBe(6)
    expect(pauseRemainingSeconds(10_000, 10_000)).toBe(0)
    expect(pauseRemainingSeconds(10_000, 99_000)).toBe(0)
  })
})

describe('a pause does not silence a new, worse alarm', () => {
  it('ends the pause when a higher priority arrives', () => {
    expect(pauseSurvives([alarm(PRIORITY.MEDIUM)], [alarm(PRIORITY.HIGH)])).toBe(false)
  })

  it('keeps the pause for an alarm of the same priority', () => {
    expect(pauseSurvives(
      [alarm(PRIORITY.MEDIUM, 'low-mv')],
      [alarm(PRIORITY.MEDIUM, 'low-mv'), alarm(PRIORITY.MEDIUM, 'low-vte')],
    )).toBe(true)
  })

  it('keeps the pause for an alarm of lower priority', () => {
    expect(pauseSurvives([alarm(PRIORITY.HIGH)], [alarm(PRIORITY.LOW)])).toBe(true)
  })

  it('keeps the pause when everything clears', () => {
    expect(pauseSurvives([alarm(PRIORITY.HIGH)], [])).toBe(true)
  })

  it('ends the pause when an alarm arrives where there was none', () => {
    expect(pauseSurvives([], [alarm(PRIORITY.LOW)])).toBe(false)
  })
})

describe('confirming a change of audio state', () => {
  // Guarding the safe direction as well only teaches the operator to dismiss
  // the guard.
  it('confirms turning audio off', () => {
    expect(requiresConfirmation(false)).toBe(true)
  })

  it('does not confirm turning audio on', () => {
    expect(requiresConfirmation(true)).toBe(false)
  })
})

// A stub standing in for the browser's audio graph, so the scheduling can be
// asserted without a sound card.
function fakeContext() {
  const scheduled = []
  const node = () => ({
    connect: vi.fn(),
    frequency: { value: 0 },
    type: '',
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    start: vi.fn((at) => scheduled.push(at)),
    stop: vi.fn(),
  })
  return {
    scheduled,
    state: 'running',
    currentTime: 0,
    destination: {},
    createGain: node,
    createOscillator: node,
    resume: vi.fn(),
    close: vi.fn(),
  }
}

describe('the audio player', () => {
  it('schedules one oscillator per pulse of the burst', () => {
    const ctx = fakeContext()
    const audio = new AlarmAudio(() => ctx)
    audio.emitBurst(PRIORITY.HIGH)
    expect(ctx.scheduled).toHaveLength(burstPulses(PRIORITY.HIGH).length)
    audio.dispose()
  })

  it('schedules nothing while the context is suspended', () => {
    const ctx = fakeContext()
    ctx.state = 'suspended'
    const audio = new AlarmAudio(() => ctx)
    audio.emitBurst(PRIORITY.HIGH)
    expect(ctx.scheduled).toHaveLength(0)
    audio.dispose()
  })

  // A re-render must not restart the burst, or the rhythm that carries the
  // priority is destroyed by the interface redrawing.
  it('leaves a tone already playing undisturbed', () => {
    const audio = new AlarmAudio(() => fakeContext())
    audio.play(PRIORITY.HIGH)
    const timer = audio.timer
    audio.play(PRIORITY.HIGH)
    expect(audio.timer).toBe(timer)
    audio.dispose()
  })

  it('switches tone when the priority changes', () => {
    const audio = new AlarmAudio(() => fakeContext())
    audio.play(PRIORITY.MEDIUM)
    audio.play(PRIORITY.HIGH)
    expect(audio.priority).toBe(PRIORITY.HIGH)
    audio.dispose()
  })

  it('stops cleanly', () => {
    const audio = new AlarmAudio(() => fakeContext())
    audio.play(PRIORITY.HIGH)
    audio.stop()
    expect(audio.running).toBe(false)
    expect(audio.priority).toBeNull()
    audio.dispose()
  })

  // Audio being unavailable is not a reason for the simulator to stop: the
  // visual annunciation carries the alarm on its own.
  it('degrades to silence when no audio context can be made', () => {
    const audio = new AlarmAudio(() => null)
    expect(() => audio.play(PRIORITY.HIGH)).not.toThrow()
    expect(audio.available).toBe(false)
    expect(audio.running).toBe(false)
    audio.dispose()
  })

  it('degrades to silence when constructing the context throws', () => {
    const audio = new AlarmAudio(() => { throw new Error('blocked') })
    expect(() => audio.play(PRIORITY.HIGH)).not.toThrow()
    expect(audio.available).toBe(false)
    audio.dispose()
  })

  it('resumes a suspended context on unlock', () => {
    const ctx = fakeContext()
    ctx.state = 'suspended'
    const audio = new AlarmAudio(() => ctx)
    audio.unlock()
    expect(ctx.resume).toHaveBeenCalled()
    audio.dispose()
  })

  it('plays nothing for an unknown priority', () => {
    const audio = new AlarmAudio(() => fakeContext())
    audio.play('urgent')
    expect(audio.running).toBe(false)
    audio.dispose()
  })
})
