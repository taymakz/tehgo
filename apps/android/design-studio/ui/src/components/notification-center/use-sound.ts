"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { playSound } from "@workspace/ui/lib/sound-engine"
import type {
  PlayFunction,
  SoundAsset,
  SoundControls,
  UseSoundOptions,
  UseSoundReturn,
} from "@workspace/ui/lib/sound-types"

export function useSound(
  sound: SoundAsset,
  options: UseSoundOptions = {}
): UseSoundReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)
  // Mirrored into refs (rather than read directly) so `play`'s identity below
  // stays stable across sound/options changes while still reading the latest
  // value when actually invoked (async, always after this effect has run).
  const soundRef = useRef(sound)
  const optsRef = useRef(options)
  useEffect(() => {
    soundRef.current = sound
  }, [sound])
  useEffect(() => {
    optsRef.current = options
  }, [options])

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setIsPlaying(false)
    optsRef.current.onStop?.()
  }, [])

  const play: PlayFunction = useCallback(
    (overrides) => {
      const {
        volume = 1,
        playbackRate = 1,
        interrupt = false,
        soundEnabled = true,
      } = optsRef.current
      if (!soundEnabled) return
      if (interrupt) stop()

      setIsPlaying(true)
      optsRef.current.onPlay?.()

      playSound(soundRef.current.dataUri, {
        volume: overrides?.volume ?? volume,
        playbackRate: overrides?.playbackRate ?? playbackRate,
        onEnd: () => {
          setIsPlaying(false)
          stopRef.current = null
          optsRef.current.onEnd?.()
        },
      })
        .then((playback) => {
          stopRef.current = playback.stop
        })
        .catch(() => {
          setIsPlaying(false)
        })
    },
    [stop]
  )

  const controls: SoundControls = {
    stop,
    pause: stop,
    isPlaying,
    duration: sound.duration,
    sound,
  }

  return [play, controls] as const
}
