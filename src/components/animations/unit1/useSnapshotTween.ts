'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * Tweens a numeric snapshot from its current values to `target`. The live
 * values start wherever they were, so jumping between Steps animates from the
 * picture on screen. Under reduced motion the target is returned at once.
 */
export function useSnapshotTween<T extends object>(
  target: T,
  reducedMotion: boolean,
  duration = 0.8
): T {
  const live = useRef<Record<string, number>>({ ...(target as Record<string, number>) })
  const [tweened, setTweened] = useState<T>(() => ({ ...target }))
  const key = JSON.stringify(target)

  useEffect(() => {
    const goal = JSON.parse(key) as Record<string, number>
    if (reducedMotion) {
      live.current = { ...goal }
      return
    }
    const tween = gsap.to(live.current, {
      ...goal,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => setTweened({ ...live.current } as T),
    })
    return () => {
      tween.kill()
    }
    // `key` is the JSON form of `target`, which is rebuilt on every render.
  }, [key, reducedMotion, duration])

  return reducedMotion ? target : tweened
}
