'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * A number that tweens from its current value to `target` whenever `target` changes. Under
 * reduced motion it is simply `target`. The tween is killed on cleanup, so a fast scroll never
 * leaves two tweens fighting over one value.
 */
export function useTweenedNumber(target: number, reducedMotion: boolean, duration = 1.0): number {
  const [value, setValue] = useState(target)
  const current = useRef(target)

  useEffect(() => {
    if (reducedMotion) return
    const state = { v: current.current }
    const tween = gsap.to(state, {
      v: target,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        current.current = state.v
        setValue(state.v)
      },
    })
    return () => {
      tween.kill()
    }
  }, [target, reducedMotion, duration])

  return reducedMotion ? target : value
}

/**
 * A number that sweeps from `from` to `to` each time `key` changes, restarting at `from`. Under
 * reduced motion it is `to`.
 */
export function useSweptNumber(
  key: number,
  from: number,
  to: number,
  reducedMotion: boolean,
  duration = 1.6
): number {
  const [value, setValue] = useState(from)

  useEffect(() => {
    if (reducedMotion) return
    const state = { v: from }
    const tween = gsap.fromTo(
      state,
      { v: from },
      {
        v: to,
        duration,
        ease: 'power1.inOut',
        onUpdate: () => setValue(state.v),
      }
    )
    return () => {
      tween.kill()
    }
    // The sweep restarts only when the Step (key) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reducedMotion])

  return reducedMotion ? to : value
}
