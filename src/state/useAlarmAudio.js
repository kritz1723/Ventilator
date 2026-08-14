import { useEffect, useRef, useState } from 'react'
import { AlarmAudio } from '../engine/alarmAudio.js'
import { AUDIO_STATE, audioStateFor, leadingAlarm } from '../engine/alarmTones.js'

// Drives the alarm tone from the alarm list.
//
// The decision of what should sound is recomputed from state on every change
// rather than tracked as a sequence of start and stop calls. Tracking it
// would mean a missed stop leaves a tone sounding for an alarm that has
// cleared, which is worse than no tone at all: it teaches the operator that
// the sound does not mean anything.

export function useAlarmAudio({ enabled, pausedUntil, alarms, now }) {
  const audioRef = useRef(null)
  const [unlocked, setUnlocked] = useState(false)

  if (!audioRef.current) audioRef.current = new AlarmAudio()

  // Browsers hold audio until the page has been interacted with. Rather than
  // asking the operator to permit sound, the first interaction of any kind
  // releases it.
  useEffect(() => {
    const audio = audioRef.current
    const release = () => {
      if (audio.unlock()) setUnlocked(true)
    }
    const events = ['pointerdown', 'keydown', 'touchstart']
    for (const e of events) window.addEventListener(e, release, { passive: true })
    release()
    return () => {
      for (const e of events) window.removeEventListener(e, release)
    }
  }, [])

  const state = audioStateFor({ enabled, pausedUntil, alarms, now })
  const leading = leadingAlarm(alarms)

  useEffect(() => {
    const audio = audioRef.current
    if (state === AUDIO_STATE.SOUNDING && leading) audio.play(leading.priority)
    else audio.stop()
  }, [state, leading?.priority, leading])

  useEffect(() => () => audioRef.current?.dispose(), [])

  return {
    state,
    // Reported so the interface can say that sound is pending a first touch
    // rather than leaving the operator to wonder why an alarm is silent.
    unlocked,
    available: audioRef.current.available,
    soundingPriority: state === AUDIO_STATE.SOUNDING ? leading?.priority ?? null : null,
  }
}
