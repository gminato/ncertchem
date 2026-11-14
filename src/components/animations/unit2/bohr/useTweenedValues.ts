'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'

/**
 * Tweens a set of numbers from wherever they are now to `target`, and returns
 * the live values for rendering. The target is deterministic per Step, so
 * scrolling back and forth always lands on the same picture. Under reduced
 * motion the values are cut straight to the target.
 */
export function useTweenedValues<T extends Record<string, number>>(
  target: T,
  reducedMotion: boolean,
  duration = 0.9
): T {
  const key = JSON.stringify(target)
  const [live] = useState<T>(() => ({ ...target }))
  const [view, setView] = useState<T>(() => ({ ...target }))

  useEffect(() => {
    const render = () => setView({ ...live })

    if (reducedMotion) {
      Object.assign(live, target)
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }

    const tween = gsap.to(live, {
      ...target,
      duration,
      ease: 'power2.inOut',
      onUpdate: render,
    })
    return () => {
      tween.kill()
    }
    // `target` is captured through `key`, which changes whenever its values do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reducedMotion])

  return view
}
