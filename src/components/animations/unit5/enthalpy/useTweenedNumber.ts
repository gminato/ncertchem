'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/** Seconds for one tween between two Step targets. */
export const TWEEN_SECONDS = 1.1

/**
 * A number that tweens from wherever it is now to `target`, so a fast scroll never jumps back.
 * Reduced motion cuts straight to the target.
 */
export function useTweenedNumber(target: number, reducedMotion: boolean): number {
  const [value, setValue] = useState(target)
  const live = useRef(target)

  useEffect(() => {
    if (reducedMotion) {
      const cut = gsap.delayedCall(0, () => {
        live.current = target
        setValue(target)
      })
      return () => {
        cut.kill()
      }
    }
    const state = { v: live.current }
    const tween = gsap.to(state, {
      v: target,
      duration: TWEEN_SECONDS,
      ease: 'power2.inOut',
      onUpdate: () => {
        live.current = state.v
        setValue(state.v)
      },
    })
    return () => {
      tween.kill()
    }
  }, [target, reducedMotion])

  return value
}
