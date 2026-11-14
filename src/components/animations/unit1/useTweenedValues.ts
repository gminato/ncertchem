'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/** Duration, in seconds, of the cross-fade or reveal between two Steps. */
export const STEP_TWEEN_SECONDS = 0.6

/**
 * Tweens a list of numbers toward `targets`. The tween starts from the values
 * on screen, so changing Step part way through a fade still lands on the right
 * picture. Reduced motion jumps straight to the targets.
 */
export function useTweenedValues(
  targets: readonly number[],
  reducedMotion: boolean,
  duration = STEP_TWEEN_SECONDS
): number[] {
  const key = targets.join(',')
  const [values, setValues] = useState<number[]>(() => [...targets])
  const current = useRef<number[]>([...targets])

  useEffect(() => {
    const to = key.split(',').map(Number)
    const from = current.current

    if (reducedMotion) {
      // Deferred, so no state update runs synchronously inside the effect.
      const jump = gsap.delayedCall(0, () => {
        current.current = to
        setValues(to)
      })
      return () => {
        jump.kill()
      }
    }

    const proxy = { t: 0 }
    const tween = gsap.to(proxy, {
      t: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        const next = from.map((f, i) => f + (to[i] - f) * proxy.t)
        current.current = next
        setValues(next)
      },
    })
    return () => {
      tween.kill()
    }
  }, [key, reducedMotion, duration])

  return values
}
