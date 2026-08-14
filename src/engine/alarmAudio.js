import { burstPulses, burstDurationMs, patternFor } from './alarmTones.js'

// The oscillators. Everything that decides *whether* to make a sound lives in
// alarmTones.js; this file only makes it.
//
// Tones are synthesised rather than loaded from files. A ventilator alarm is
// a few pulses of a pitched tone, which the Web Audio API produces exactly,
// and shipping audio assets would mean a page that alarms only once its
// sounds have downloaded.
//
// Browsers refuse to start audio until the user has interacted with the page.
// That is not an error to report — it is the normal state of a page nobody
// has touched yet — so the context is created lazily and resumed on the first
// interaction. Until then the visual annunciation carries the alarm on its
// own, which is why the audible signal is never the only one.

export class AlarmAudio {
  constructor(createContext) {
    this.createContext = createContext ?? (() => {
      const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext
      return Ctor ? new Ctor() : null
    })
    this.ctx = null
    this.master = null
    this.timer = null
    this.priority = null
    this.failed = false
  }

  // Called from a user gesture. Safe to call repeatedly.
  unlock() {
    const ctx = this.context()
    if (!ctx) return false
    if (ctx.state === 'suspended') ctx.resume?.()
    return ctx.state !== 'suspended'
  }

  context() {
    if (this.failed) return null
    if (!this.ctx) {
      try {
        this.ctx = this.createContext()
        if (!this.ctx) {
          this.failed = true
          return null
        }
        this.master = this.ctx.createGain()
        this.master.gain.value = 1
        this.master.connect(this.ctx.destination)
      } catch {
        // Audio being unavailable is not a reason for the simulator to stop.
        this.failed = true
        return null
      }
    }
    return this.ctx
  }

  get available() {
    return !this.failed
  }

  get running() {
    return this.timer != null
  }

  // Idempotent in the priority: asking for the tone already playing leaves
  // its rhythm undisturbed, so a re-render does not restart the burst.
  play(priority) {
    if (this.priority === priority && this.timer != null) return
    this.stop()
    if (!patternFor(priority)) return
    const ctx = this.context()
    if (!ctx) return
    this.priority = priority
    const pattern = patternFor(priority)
    const burst = () => this.emitBurst(priority)
    burst()
    this.timer = setInterval(burst, Math.max(pattern.intervalMs, burstDurationMs(priority) + 250))
  }

  stop() {
    if (this.timer != null) clearInterval(this.timer)
    this.timer = null
    this.priority = null
  }

  emitBurst(priority) {
    const ctx = this.context()
    if (!ctx || ctx.state === 'suspended') return
    const now = ctx.currentTime
    for (const pulse of burstPulses(priority)) {
      const at = now + pulse.atMs / 1000
      const until = at + pulse.durationMs / 1000
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = pulse.frequency
        // A pulse with square edges clicks; the ramps are what make it read
        // as a tone rather than as a fault in the speaker.
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(pulse.gain, at + 0.012)
        gain.gain.setValueAtTime(pulse.gain, until - 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, until)
        osc.connect(gain)
        gain.connect(this.master)
        osc.start(at)
        osc.stop(until + 0.02)
      } catch {
        // A pulse that cannot be scheduled is dropped rather than allowed to
        // take the rest of the burst with it.
        return
      }
    }
  }

  dispose() {
    this.stop()
    try {
      this.ctx?.close?.()
    } catch {
      // Closing a context that is already gone is not a failure.
    }
    this.ctx = null
    this.master = null
  }
}
