'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * Tweens a set of numbers from wherever they are now towards `target`, every time the target
 * changes. Under reduced motion the target is returned at once. The live value is kept in a
 * ref, so a new target that arrives mid-tween starts from the picture on screen.
 */
export function useStepTween<T extends Record<string, number>>(target: T, reducedMotion: boolean, duration = 0.9): T {
  const [state, setState] = useState<T>(target)
  const current = useRef<T>(target)
  const keyed = JSON.stringify(target)

  useEffect(() => {
    if (reducedMotion) return
    const to = JSON.parse(keyed) as T
    const from: Record<string, number> = { ...current.current }
    const tween = gsap.to(from, {
      ...to,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        const next = { ...from } as T
        current.current = next
        setState(next)
      },
    })
    return () => {
      tween.kill()
    }
  }, [keyed, reducedMotion, duration])

  return reducedMotion ? target : state
}

/**
 * A value that fades from 0 to 1 each time `key` changes (1 at once under reduced motion). Used
 * for drawings that appear with a Step, where the end state is fixed and only the reveal moves.
 */
export function useReveal(key: string | number, reducedMotion: boolean, duration = 0.8): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    const holder = { v: 0 }
    const tween = gsap.to(holder, {
      v: 1,
      duration,
      ease: 'power2.out',
      onUpdate: () => setValue(holder.v),
    })
    return () => {
      tween.kill()
    }
  }, [key, reducedMotion, duration])

  return reducedMotion ? 1 : value
}
