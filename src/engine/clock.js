// Fixed-timestep simulation clock. Uses requestAnimationFrame for scheduling
// but always advances the simulation in fixed-size steps so the physics
// integration is independent of actual frame rate.

const DEFAULT_STEP_SECONDS = 0.02 // 50 Hz

export class SimClock {
  constructor({ stepSeconds = DEFAULT_STEP_SECONDS, maxStepsPerFrame = 10 } = {}) {
    this.stepSeconds = stepSeconds
    this.maxStepsPerFrame = maxStepsPerFrame
    this.running = false
    this.accumulator = 0
    this.lastTime = 0
    this.frameHandle = null
  }

  start(onTick) {
    if (this.running) return
    this.running = true
    this.accumulator = 0
    this.lastTime = performance.now()

    const frame = (now) => {
      if (!this.running) return
      const elapsed = Math.min((now - this.lastTime) / 1000, 0.25)
      this.lastTime = now
      this.accumulator += elapsed

      let steps = 0
      while (this.accumulator >= this.stepSeconds && steps < this.maxStepsPerFrame) {
        onTick(this.stepSeconds)
        this.accumulator -= this.stepSeconds
        steps += 1
      }
      this.frameHandle = requestAnimationFrame(frame)
    }
    this.frameHandle = requestAnimationFrame(frame)
  }

  stop() {
    this.running = false
    if (this.frameHandle != null) {
      cancelAnimationFrame(this.frameHandle)
      this.frameHandle = null
    }
  }
}
