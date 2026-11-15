'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * Tweens a set of numbers from wherever they are now to a Step's target state. Each new target
 * kills the previous tween, so scrolling in either direction lands on the same picture. Under
 * reduced motion the values are cut straight to the target.
 *
 * @param target The Step's target state. Only its numeric fields are tweened.
 * @param reducedMotion When true, no tween runs.
 * @param duration Tween length in seconds.
 */
export function useTweenedSnapshot<T extends Record<string, number>>(
  target: T,
  reducedMotion: boolean,
  duration = 0.9
): T {
  const live = useRef<T>({ ...target })
  const [view, setView] = useState<T>({ ...target })
  const key = JSON.stringify(target)

  useEffect(() => {
    const goal = JSON.parse(key) as T
    if (reducedMotion) {
      Object.assign(live.current, goal)
      const redraw = gsap.delayedCall(0, () => setView({ ...live.current }))
      return () => {
        redraw.kill()
      }
    }
    const tween = gsap.to(live.current, {
      ...goal,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => setView({ ...live.current }),
    })
    return () => {
      tween.kill()
    }
    // `live` is stable for the component lifetime; the target is keyed by its JSON.
  }, [key, reducedMotion, duration])

  return view
}

/** Clamps a Step index to 0 … count − 1. Non-finite input maps to 0. */
export function clampIndex(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}
