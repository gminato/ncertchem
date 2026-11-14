'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * Tweens a set of numeric animation values from their current state to the
 * target for `step`. Each Step has one deterministic target, so scrolling
 * back and forth always lands on the same picture. Under reduced motion the
 * values are set straight to the target.
 *
 * `targetFor` must be a stable, module-level function.
 */
export function useStepTween<T extends object>(
  step: number,
  targetFor: (step: number) => T,
  reducedMotion: boolean,
  duration = 0.9
): T {
  const [initial] = useState<T>(() => ({ ...targetFor(step) }))
  const live = useRef<T>(initial)
  const [view, setView] = useState<T>(initial)

  useEffect(() => {
    const state = live.current
    const render = () => setView({ ...state })
    if (reducedMotion) {
      Object.assign(state, targetFor(step))
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }
    const tween = gsap.to(state, {
      ...targetFor(step),
      duration,
      ease: 'power2.inOut',
      onUpdate: render,
    })
    return () => {
      tween.kill()
    }
    // `targetFor` and `duration` are stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reducedMotion])

  return view
}
